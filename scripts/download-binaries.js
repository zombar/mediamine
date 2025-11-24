import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.join(__dirname, '../resources');

const YTDLP_RELEASES = {
  mac: {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    filename: 'yt-dlp',
  },
  win: {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    filename: 'yt-dlp.exe',
  },
  linux: {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
    filename: 'yt-dlp',
  },
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    console.log(`Downloading from ${url}...`);

    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadBinaries() {
  console.log('Downloading yt-dlp binaries for all platforms...\n');

  for (const [platform, config] of Object.entries(YTDLP_RELEASES)) {
    const platformDir = path.join(resourcesDir, platform);
    const binaryPath = path.join(platformDir, config.filename);

    // Create directory if it doesn't exist
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
    }

    // Skip if binary already exists
    if (fs.existsSync(binaryPath)) {
      console.log(`✓ ${platform}: yt-dlp already exists at ${binaryPath}`);
      continue;
    }

    try {
      await downloadFile(config.url, binaryPath);

      // Set executable permissions for Unix-like systems
      if (platform !== 'win') {
        fs.chmodSync(binaryPath, '755');
      }

      const stats = fs.statSync(binaryPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✓ ${platform}: Downloaded ${sizeMB} MB to ${binaryPath}\n`);
    } catch (error) {
      console.error(`✗ ${platform}: Failed to download yt-dlp`);
      console.error(`  Error: ${error.message}\n`);
      // Don't fail the whole process if one platform fails
    }
  }

  console.log('Binary download complete!');
}

// Run the download
downloadBinaries().catch((error) => {
  console.error('Fatal error during binary download:', error);
  process.exit(1);
});
