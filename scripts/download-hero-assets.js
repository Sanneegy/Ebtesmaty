const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'images', 'hero');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const assets = [
  // 1. Full-bleed background treatment photo (dentist treating patient with smile and gloved hands)
  {
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1920&q=85',
    filename: 'hero_bg_treatment.jpg',
  },
  // 2. High-res close-up of a patient's happy smile in dental care
  {
    url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1400&q=85',
    filename: 'hero_dental_care.jpg',
  },
  // 3. Close up radiant smiling woman (for thumbnail and inline pill)
  {
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=85',
    filename: 'hero_radiant_smile.jpg',
  },
  // 4. Modern dentist in clinic with tools
  {
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=85',
    filename: 'hero_doctor_thumb.jpg',
  },
  // 5. Patient avatars for trust social proof cards
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    filename: 'avatar_1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    filename: 'avatar_2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    filename: 'avatar_3.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    filename: 'avatar_4.jpg',
  },
];

async function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, item.filename);
    const file = fs.createWriteStream(dest);
    https.get(item.url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${item.filename}: status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  for (const asset of assets) {
    console.log(`Downloading ${asset.filename}...`);
    try {
      await download(asset);
      console.log(`✓ ${asset.filename}`);
    } catch (e) {
      console.error(`✗ ${asset.filename}:`, e.message);
    }
  }
  console.log('All hero assets downloaded.');
}

run();
