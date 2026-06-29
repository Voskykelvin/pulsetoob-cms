const DEFAULT_SITE_URL = 'https://www.pulsetoob.com';
const DEFAULT_API_URL = 'https://pulsetoob-cms.onrender.com';

const siteUrl = (process.env.SMOKE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
const apiUrl = (process.env.SMOKE_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/api$/, '').replace(/\/+$/, '');

const checks = [
  { name: 'Homepage', url: `${siteUrl}/`, includes: ['PulseToob', 'G-WSWVPG42ZF', 'secureprivacy'] },
  { name: 'Blog', url: `${siteUrl}/blog`, includes: ['All Stories'] },
  { name: 'Search', url: `${siteUrl}/search`, includes: ['Search PulseToob'] },
  { name: 'Privacy', url: `${siteUrl}/privacy`, includes: ['Privacy Policy'] },
  { name: 'Sitemap', url: `${siteUrl}/sitemap.xml`, includes: ['urlset'] },
  { name: 'Robots', url: `${siteUrl}/robots.txt`, includes: ['Sitemap'] },
  { name: 'Backend health', url: `${apiUrl}/health` },
  { name: 'Backend readiness', url: `${apiUrl}/ready` },
];

async function checkEndpoint(check) {
  const response = await fetch(check.url, { redirect: 'follow' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${check.name} returned ${response.status}`);
  }

  for (const expected of check.includes || []) {
    if (!text.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error(`${check.name} did not include "${expected}"`);
    }
  }

  return { name: check.name, status: response.status };
}

async function main() {
  const failures = [];

  for (const check of checks) {
    try {
      const result = await checkEndpoint(check);
      console.log(`OK ${result.name} (${result.status})`);
    } catch (error) {
      failures.push({ check, error });
      console.error(`FAIL ${check.name}: ${error.message}`);
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
