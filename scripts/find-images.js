const https = require('https');

function fetchPage(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'unsplash.com',
      path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    };
    https.get(options, res => {
      console.log('Status:', res.statusCode, 'Location:', res.headers.location);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, res2 => {
          let html = '';
          res2.on('data', chunk => html += chunk);
          res2.on('end', () => resolve(html));
        });
        return;
      }
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve(html));
    }).on('error', (e) => {
      console.error(e);
      resolve('');
    });
  });
}

async function main() {
  const html = await fetchPage('/s/photos/dentist-patient-smile');
  const regex = /https:\/\/[^"'\s<>]+(?:unsplash\.com\/photo-|plus\.unsplash\.com\/premium_photo-)[^"'\s<>?]+/g;
  const set = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    set.add(m[0]);
  }
  console.log('Found:', Array.from(set).slice(0, 15));
}

main();
