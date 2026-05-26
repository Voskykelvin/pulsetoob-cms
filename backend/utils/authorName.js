const cleanAuthorName = (value) => {
  const name = String(value || '').trim();
  if (!name) return '';

  return name
    .replace(/\s*@pulsetoob(?:\.com)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getAuthorName = (author, fallback = 'PulseToob') => {
  const fullName = cleanAuthorName([author?.firstName, author?.lastName].filter(Boolean).join(' '));
  const username = cleanAuthorName(author?.username);

  return fullName || username || fallback;
};

module.exports = { cleanAuthorName, getAuthorName };
