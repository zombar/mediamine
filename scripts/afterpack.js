import fs from 'fs';
import path from 'path';

/**
 * electron-builder afterPack hook
 * Ensures yt-dlp binary has executable permissions after packing
 *
 * @param {object} context - electron-builder context
 */
export default async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager } = context;

  console.log(`\nRunning afterPack hook for platform: ${electronPlatformName}`);

  // Only need to set permissions on Unix-like systems
  if (electronPlatformName !== 'darwin' && electronPlatformName !== 'linux') {
    console.log('Skipping permission setting (Windows platform)');
    return;
  }

  // Determine the resources path based on platform
  let resourcesPath;
  if (electronPlatformName === 'darwin') {
    const appName = `${packager.appInfo.productFilename}.app`;
    resourcesPath = path.join(appOutDir, appName, 'Contents', 'Resources');
  } else {
    // Linux
    resourcesPath = path.join(appOutDir, 'resources');
  }

  const binaryPath = path.join(resourcesPath, 'bin', 'yt-dlp');

  console.log(`Checking for binary at: ${binaryPath}`);

  if (fs.existsSync(binaryPath)) {
    try {
      // Set executable permissions (rwxr-xr-x)
      fs.chmodSync(binaryPath, '755');
      console.log(`✓ Set executable permissions (755) for ${binaryPath}`);

      // Verify permissions were set
      const stats = fs.statSync(binaryPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      console.log(`  Verified permissions: ${mode}`);
    } catch (error) {
      console.error(`✗ Failed to set permissions: ${error.message}`);
      throw error;
    }
  } else {
    console.warn(`⚠ Warning: yt-dlp binary not found at ${binaryPath}`);
    console.warn('  The app may not function correctly without the binary.');
  }

  console.log('afterPack hook complete\n');
}
