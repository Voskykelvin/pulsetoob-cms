const baseUrl = process.env.API_URL || 'http://localhost:5000';

const check = async (path) => {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
};

(async () => {
  await check('/health');
  await check('/ready');
  console.log(`Smoke check passed against ${baseUrl}`);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
