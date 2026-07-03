const DEFAULT_SITE_URL = 'https://www.pulsetoob.com';
const DEFAULT_API_URL = 'https://pulsetoob-cms.onrender.com';
const ADSENSE_CLIENT = 'ca-pub-1646346199767276';
const ADSENSE_PUBLISHER_ID = 'pub-1646346199767276';
const ADS_TXT_LINE = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`;
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_NEWS_URLS = 1000;

const siteUrl = (process.env.SMOKE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
const apiUrl = (process.env.SMOKE_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/api$/, '').replace(/\/+$/, '');

const checks = [
  {
    name: 'Homepage',
    url: `${siteUrl}/`,
    includes: ['PulseToob', 'G-WSWVPG42ZF', 'secureprivacy', 'google-consent-mode', ADSENSE_SCRIPT_URL],
    validate: validateHomepage,
  },
  { name: 'Blog', url: `${siteUrl}/blog`, includes: ['All Stories'] },
  { name: 'Search', url: `${siteUrl}/search`, includes: ['Search PulseToob'] },
  { name: 'About', url: `${siteUrl}/about`, includes: ['About PulseToob', 'Editorial Independence', 'Corrections', 'Privacy'] },
  { name: 'Contact', url: `${siteUrl}/contact`, includes: ['Contact Form', 'Direct Email', 'Advertising'] },
  { name: 'Privacy', url: `${siteUrl}/privacy`, includes: ['Privacy Policy', 'Google Analytics', 'Google AdSense', 'Cookies And Consent'] },
  { name: 'Sitemap', url: `${siteUrl}/sitemap.xml`, includes: ['urlset'] },
  { name: 'News sitemap', url: `${siteUrl}/news-sitemap.xml`, includes: ['urlset', 'xmlns:news'], validate: validateNewsSitemap },
  { name: 'Robots', url: `${siteUrl}/robots.txt`, includes: ['Sitemap'], validate: validateRobots },
  { name: 'Ads.txt', url: `${siteUrl}/ads.txt`, includes: [ADS_TXT_LINE], validate: validateAdsTxt },
  { name: 'Backend health', url: `${apiUrl}/health` },
  { name: 'Backend readiness', url: `${apiUrl}/ready` },
];

function normalizeForMatch(value) {
  return value.toLowerCase();
}

function getHeader(response, name) {
  return response.headers.get(name) || '';
}

function getMatches(text, regex) {
  const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
  return Array.from(text.matchAll(globalRegex), (match) => match[1]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, expected, checkName) {
  if (!normalizeForMatch(text).includes(normalizeForMatch(expected))) {
    throw new Error(`${checkName} did not include "${expected}"`);
  }
}

function validateHomepage({ text }) {
  assertIncludes(text, `name="google-adsense-account"`, 'Homepage AdSense account meta tag');
  assertIncludes(text, `content="${ADSENSE_CLIENT}"`, 'Homepage AdSense account meta tag');
  assertIncludes(text, 'ad_storage', 'Homepage consent defaults');
  assertIncludes(text, 'analytics_storage', 'Homepage consent defaults');
  assertIncludes(text, 'ad_user_data', 'Homepage consent defaults');
  assertIncludes(text, 'ad_personalization', 'Homepage consent defaults');
  assertIncludes(text, 'header_leaderboard', 'Homepage ad layout');

  if (text.includes('/article/')) {
    assertIncludes(text, 'in_article_banner', 'Homepage ad layout');
  }
}

function validateAdsTxt({ response, text }) {
  const contentType = getHeader(response, 'content-type').toLowerCase();
  assert(contentType.includes('text/plain'), `Ads.txt content-type was "${contentType || 'missing'}"`);
  assert(text.trim() === ADS_TXT_LINE, 'Ads.txt content did not match the authorized seller record exactly');
}

function validateRobots({ text }) {
  assertIncludes(text, 'Sitemap:', 'Robots');
  assertIncludes(text, '/sitemap.xml', 'Robots');
  assertIncludes(text, '/news-sitemap.xml', 'Robots');
  assert(!/disallow:\s*\/news-sitemap\.xml/i.test(text), 'Robots blocks the news sitemap');
  assert(!/disallow:\s*\/ads\.txt/i.test(text), 'Robots blocks ads.txt');
}

function validateNewsSitemap({ response, text }) {
  const contentType = getHeader(response, 'content-type').toLowerCase();
  assert(
    contentType.includes('application/xml') || contentType.includes('text/xml'),
    `News sitemap content-type was "${contentType || 'missing'}"`
  );
  assert(text.trim().startsWith('<?xml'), 'News sitemap is missing the XML declaration');
  assertIncludes(text, 'xmlns:image', 'News sitemap');

  const urls = getMatches(text, /<url>([\s\S]*?)<\/url>/g);
  assert(urls.length <= MAX_NEWS_URLS, `News sitemap has ${urls.length} URLs; Google News allows ${MAX_NEWS_URLS}`);

  const now = Date.now();
  for (const entry of urls) {
    const loc = getMatches(entry, /<loc>([\s\S]*?)<\/loc>/)[0];
    const publicationName = getMatches(entry, /<news:name>([\s\S]*?)<\/news:name>/)[0];
    const language = getMatches(entry, /<news:language>([\s\S]*?)<\/news:language>/)[0];
    const publicationDate = getMatches(entry, /<news:publication_date>([\s\S]*?)<\/news:publication_date>/)[0];
    const title = getMatches(entry, /<news:title>([\s\S]*?)<\/news:title>/)[0];
    const publishedAt = publicationDate ? Date.parse(publicationDate) : NaN;

    assert(loc && /^https?:\/\//i.test(loc), 'News sitemap entry is missing an absolute <loc>');
    assert(publicationName === 'PulseToob', 'News sitemap entry has an unexpected publication name');
    assert(language === 'en', 'News sitemap entry has an unexpected publication language');
    assert(title && title.trim().length > 0, 'News sitemap entry is missing a title');
    assert(Number.isFinite(publishedAt), `News sitemap entry has an invalid publication date: ${publicationDate || 'missing'}`);
    assert(now - publishedAt <= NEWS_WINDOW_MS + 5 * 60 * 1000, `News sitemap entry is older than 48 hours: ${loc}`);
  }
}

async function checkEndpoint(check) {
  const response = await fetch(check.url, { redirect: 'follow' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${check.name} returned ${response.status}`);
  }

  for (const expected of check.includes || []) {
    assertIncludes(text, expected, check.name);
  }

  if (check.validate) check.validate({ response, text });

  return { name: check.name, status: response.status, text };
}

function findFirstArticlePath(homepageHtml) {
  const articleHref = getMatches(homepageHtml, /href="(\/article\/[^"#?]+)"/)[0];
  return articleHref || null;
}

async function checkArticleAdLayout(homepageHtml) {
  const articlePath = findFirstArticlePath(homepageHtml);

  if (!articlePath) {
    console.log('SKIP Article ad layout (no article link found on homepage)');
    return;
  }

  const articleUrl = `${siteUrl}${articlePath}`;
  const response = await fetch(articleUrl, { redirect: 'follow' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Article ad layout returned ${response.status}`);
  }

  assertIncludes(text, 'header_leaderboard', 'Article ad layout');
  assertIncludes(text, 'in_article_banner', 'Article ad layout');
  console.log(`OK Article ad layout (${response.status})`);
}

async function main() {
  const failures = [];
  let homepageHtml = '';

  for (const check of checks) {
    try {
      const result = await checkEndpoint(check);
      if (check.name === 'Homepage') homepageHtml = result.text;
      console.log(`OK ${result.name} (${result.status})`);
    } catch (error) {
      failures.push({ check, error });
      console.error(`FAIL ${check.name}: ${error.message}`);
    }
  }

  if (homepageHtml) {
    try {
      await checkArticleAdLayout(homepageHtml);
    } catch (error) {
      failures.push({ check: { name: 'Article ad layout' }, error });
      console.error(`FAIL Article ad layout: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} deployment smoke check(s) failed.`);
    process.exit(1);
  }

  console.log('\nDeployment smoke checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
