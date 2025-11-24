# Phase 3: URL Input & Download System

## Overview
Implement a comprehensive video download system supporting YouTube and 1000+ other video platforms using yt-dlp. This phase adds URL input, quality selection, download management, and progress tracking using Test-Driven Development.

## Dependencies
- Phase 2 must be completed
- yt-dlp-wrap (Node.js wrapper for yt-dlp)
- Python 3.7+ installed on system

## Goals
- URL input with validation and source detection
- Integration with yt-dlp for multi-source downloads
- Quality/format selection UI
- Download progress tracking with speed and ETA
- User-configurable download location
- Downloaded video playback

---

## TDD Test Specifications (Write Tests First)

### 3.1 Playwright E2E Tests

Create `e2e/downloads.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

const TEST_DOWNLOAD_DIR = path.join(__dirname, '../test-downloads');
const SAMPLE_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up (short video for testing)

test.describe('URL Input', () => {
  test('should display URL input field', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await expect(urlInput).toBeVisible();

    await app.close();
  });

  test('should validate YouTube URL', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    const validateButton = window.locator('[data-testid="validate-url-button"]');
    await validateButton.click();

    // Should show valid indicator
    const validIndicator = window.locator('[data-testid="url-valid-indicator"]');
    await expect(validIndicator).toBeVisible();

    await app.close();
  });

  test('should detect video source type', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    const validateButton = window.locator('[data-testid="validate-url-button"]');
    await validateButton.click();

    await window.waitForTimeout(1000);

    const sourceType = window.locator('[data-testid="source-type"]');
    await expect(sourceType).toContainText(/youtube/i);

    await app.close();
  });

  test('should reject invalid URLs', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill('not-a-valid-url');

    const validateButton = window.locator('[data-testid="validate-url-button"]');
    await validateButton.click();

    const errorMessage = window.locator('[data-testid="url-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid/i);

    await app.close();
  });

  test('should support direct video file URLs', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill('https://example.com/video.mp4');

    const validateButton = window.locator('[data-testid="validate-url-button"]');
    await validateButton.click();

    const validIndicator = window.locator('[data-testid="url-valid-indicator"]');
    await expect(validIndicator).toBeVisible();

    await app.close();
  });
});

test.describe('Quality Selection', () => {
  test('should fetch available quality options', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill(SAMPLE_YOUTUBE_URL);

    const fetchButton = window.locator('[data-testid="fetch-qualities-button"]');
    await fetchButton.click();

    // Wait for quality options to load
    const qualitySelector = window.locator('[data-testid="quality-selector"]');
    await expect(qualitySelector).toBeVisible({ timeout: 10000 });

    const options = await qualitySelector.locator('option').count();
    expect(options).toBeGreaterThan(0);

    await app.close();
  });

  test('should display quality options with resolution and size', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const qualityOptions = window.locator('[data-testid="quality-option"]');
    const firstOption = qualityOptions.first();

    await expect(firstOption).toBeVisible();
    const text = await firstOption.textContent();

    // Should contain resolution (e.g., "1080p") and format info
    expect(text).toMatch(/\d+p/);

    await app.close();
  });

  test('should select default best quality', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const qualitySelector = window.locator('[data-testid="quality-selector"]');
    const selectedValue = await qualitySelector.inputValue();

    expect(selectedValue).toBeTruthy();

    await app.close();
  });

  test('should allow quality selection change', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const qualitySelector = window.locator('[data-testid="quality-selector"]');
    const options = await qualitySelector.locator('option').all();

    if (options.length > 1) {
      const secondValue = await options[1].getAttribute('value');
      await qualitySelector.selectOption(secondValue!);

      const selectedValue = await qualitySelector.inputValue();
      expect(selectedValue).toBe(secondValue);
    }

    await app.close();
  });
});

test.describe('Download Location', () => {
  test('should display download location selector', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const locationButton = window.locator('[data-testid="select-download-location"]');
    await expect(locationButton).toBeVisible();

    await app.close();
  });

  test('should show current download location', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const locationDisplay = window.locator('[data-testid="download-location-display"]');
    await expect(locationDisplay).toBeVisible();

    const text = await locationDisplay.textContent();
    expect(text).toBeTruthy();

    await app.close();
  });

  test('should open folder selection dialog', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    let dialogOpened = false;
    await app.evaluate(({ dialog }) => {
      const original = dialog.showOpenDialog;
      dialog.showOpenDialog = async (options: any) => {
        (global as any).dialogOpened = true;
        return { canceled: true, filePaths: [] };
      };
    });

    const locationButton = window.locator('[data-testid="select-download-location"]');
    await locationButton.click();

    await window.waitForTimeout(100);

    dialogOpened = await app.evaluate(() => (global as any).dialogOpened);
    expect(dialogOpened).toBe(true);

    await app.close();
  });

  test('should update location when folder selected', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const testPath = TEST_DOWNLOAD_DIR;

    await app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => {
        return { canceled: false, filePaths: [path] };
      };
    }, testPath);

    const locationButton = window.locator('[data-testid="select-download-location"]');
    await locationButton.click();

    await window.waitForTimeout(200);

    const locationDisplay = window.locator('[data-testid="download-location-display"]');
    const text = await locationDisplay.textContent();

    expect(text).toContain('test-downloads');

    await app.close();
  });
});

test.describe('Download Process', () => {
  test.beforeAll(async () => {
    // Create test download directory
    await fs.mkdir(TEST_DOWNLOAD_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    // Cleanup test downloads
    await fs.rm(TEST_DOWNLOAD_DIR, { recursive: true, force: true });
  });

  test('should display download button when URL and quality selected', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    await app.close();
  });

  test('should start download when button clicked', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    // Should show download in progress
    const downloadProgress = window.locator('[data-testid="download-progress"]');
    await expect(downloadProgress).toBeVisible({ timeout: 5000 });

    await app.close();
  });

  test('should display download progress percentage', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    const progressText = window.locator('[data-testid="download-progress-percent"]');
    await expect(progressText).toBeVisible({ timeout: 5000 });

    const text = await progressText.textContent();
    expect(text).toMatch(/\d+%/);

    await app.close();
  });

  test('should display download speed', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    await window.waitForTimeout(2000);

    const speedText = window.locator('[data-testid="download-speed"]');
    await expect(speedText).toBeVisible();

    await app.close();
  });

  test('should display ETA', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    await window.waitForTimeout(2000);

    const etaText = window.locator('[data-testid="download-eta"]');
    await expect(etaText).toBeVisible();

    await app.close();
  });

  test('should show completion message when download finishes', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    // Wait for completion (may take a while for real video)
    const completionMessage = window.locator('[data-testid="download-complete"]');
    await expect(completionMessage).toBeVisible({ timeout: 60000 });

    await app.close();
  });

  test('should allow playing downloaded video', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    // Wait for completion
    await window.locator('[data-testid="download-complete"]').waitFor({ timeout: 60000 });

    // Click play button
    const playButton = window.locator('[data-testid="play-downloaded-button"]');
    await playButton.click();

    // Video player should appear
    const videoPlayer = window.locator('[data-testid="video-player"]');
    await expect(videoPlayer).toBeVisible();

    await app.close();
  });

  test('should handle download errors gracefully', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);

    // Use invalid URL
    const urlInput = window.locator('[data-testid="url-input"]');
    await urlInput.fill('https://www.youtube.com/watch?v=invalid123');

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    if (await downloadButton.isVisible()) {
      await downloadButton.click();

      const errorMessage = window.locator('[data-testid="download-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    }

    await app.close();
  });
});

test.describe('Download Management', () => {
  test('should display download list', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    const downloadList = window.locator('[data-testid="download-list"]');
    await expect(downloadList).toBeVisible();

    await app.close();
  });

  test('should show active downloads', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    const downloadItem = window.locator('[data-testid="download-item"]');
    await expect(downloadItem).toBeVisible({ timeout: 5000 });

    await app.close();
  });

  test('should allow pausing download', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    await window.waitForTimeout(2000);

    const pauseButton = window.locator('[data-testid="pause-download-button"]');
    if (await pauseButton.isVisible()) {
      await pauseButton.click();

      const downloadStatus = window.locator('[data-testid="download-status"]');
      await expect(downloadStatus).toContainText(/paused/i);
    }

    await app.close();
  });

  test('should allow canceling download', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    await setupDownloadLocation(app, window, TEST_DOWNLOAD_DIR);
    await setUrlAndFetchQualities(window, SAMPLE_YOUTUBE_URL);

    const downloadButton = window.locator('[data-testid="start-download-button"]');
    await downloadButton.click();

    await window.waitForTimeout(2000);

    const cancelButton = window.locator('[data-testid="cancel-download-button"]');
    await cancelButton.click();

    const downloadStatus = window.locator('[data-testid="download-status"]');
    await expect(downloadStatus).toContainText(/canceled|stopped/i);

    await app.close();
  });
});

// Helper functions
async function setUrlAndFetchQualities(window: any, url: string) {
  const urlInput = window.locator('[data-testid="url-input"]');
  await urlInput.fill(url);

  const fetchButton = window.locator('[data-testid="fetch-qualities-button"]');
  await fetchButton.click();

  await window.waitForTimeout(5000); // Wait for yt-dlp to fetch formats
}

async function setupDownloadLocation(app: any, window: any, downloadPath: string) {
  await app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => {
      return { canceled: false, filePaths: [path] };
    };
  }, downloadPath);

  const locationButton = window.locator('[data-testid="select-download-location"]');
  await locationButton.click();
  await window.waitForTimeout(200);
}
```

### 3.2 Vitest Unit Tests

Create `src/main/download-manager.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadManager } from './download-manager';

describe('DownloadManager', () => {
  let manager: DownloadManager;

  beforeEach(() => {
    manager = new DownloadManager();
  });

  it('should validate YouTube URLs', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const isValid = manager.validateUrl(url);
    expect(isValid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const url = 'not-a-url';
    const isValid = manager.validateUrl(url);
    expect(isValid).toBe(false);
  });

  it('should detect YouTube as source', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const source = manager.detectSource(url);
    expect(source).toBe('youtube');
  });

  it('should detect direct video URLs', () => {
    const url = 'https://example.com/video.mp4';
    const source = manager.detectSource(url);
    expect(source).toBe('direct');
  });

  it('should fetch available formats', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const formats = await manager.fetchFormats(url);

    expect(Array.isArray(formats)).toBe(true);
    expect(formats.length).toBeGreaterThan(0);
  });

  it('should start download with progress callback', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const progressCallback = vi.fn();

    const downloadId = await manager.startDownload({
      url,
      outputPath: '/tmp/test-video.mp4',
      format: 'best',
      onProgress: progressCallback,
    });

    expect(downloadId).toBeTruthy();
  });

  it('should track multiple downloads', async () => {
    const url1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const url2 = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

    const id1 = await manager.startDownload({
      url: url1,
      outputPath: '/tmp/video1.mp4',
      format: 'best',
    });

    const id2 = await manager.startDownload({
      url: url2,
      outputPath: '/tmp/video2.mp4',
      format: 'best',
    });

    const downloads = manager.getActiveDownloads();
    expect(downloads.length).toBeGreaterThanOrEqual(2);
  });
});
```

Create `src/renderer/components/UrlInput.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UrlInput } from './UrlInput';

describe('UrlInput Component', () => {
  it('should render input field', () => {
    render(<UrlInput onUrlSubmit={vi.fn()} />);
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
  });

  it('should validate URL on button click', async () => {
    const onSubmit = vi.fn();
    render(<UrlInput onUrlSubmit={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('should show error for invalid URL', () => {
    render(<UrlInput onUrlSubmit={vi.fn()} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'invalid' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    expect(screen.getByTestId('url-error-message')).toBeInTheDocument();
  });
});
```

Create `src/renderer/components/DownloadProgress.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DownloadProgress } from './DownloadProgress';

describe('DownloadProgress Component', () => {
  it('should display progress percentage', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    expect(screen.getByTestId('download-progress-percent')).toHaveTextContent('50%');
  });

  it('should display download speed', () => {
    render(<DownloadProgress progress={50} speed={1024000} eta={30} />);
    const speedElement = screen.getByTestId('download-speed');
    expect(speedElement).toHaveTextContent(/MB\/s/);
  });

  it('should display ETA', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    expect(screen.getByTestId('download-eta')).toBeInTheDocument();
  });

  it('should show completion state', () => {
    render(<DownloadProgress progress={100} speed={0} eta={0} status="completed" />);
    expect(screen.getByTestId('download-complete')).toBeInTheDocument();
  });
});
```

---

## Implementation Steps (Red-Green-Refactor)

### Step 1: Install Dependencies

```bash
npm install yt-dlp-wrap
npm install uuid
```

### Step 2: Create Download Manager (Main Process)

Create `src/main/download-manager.ts`:

```typescript
import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface DownloadOptions {
  url: string;
  outputPath: string;
  format?: string;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface DownloadProgress {
  id: string;
  url: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'canceled';
  filename?: string;
  error?: string;
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
}

export class DownloadManager extends EventEmitter {
  private ytDlp: YTDlpWrap;
  private downloads: Map<string, DownloadProgress>;
  private activeProcesses: Map<string, any>;

  constructor() {
    super();
    this.ytDlp = new YTDlpWrap();
    this.downloads = new Map();
    this.activeProcesses = new Map();
  }

  validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  detectSource(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.match(/\.(mp4|webm|mkv|avi|mov)$/i)) {
      return 'direct';
    }
    return 'other';
  }

  async fetchFormats(url: string): Promise<VideoFormat[]> {
    try {{
      const info = await this.ytDlp.getVideoInfo([url]);

      if (!info.formats) {
        return [];
      }

      return info.formats
        .filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none')
        .map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || `${f.width}x${f.height}`,
          filesize: f.filesize,
          format_note: f.format_note,
          vcodec: f.vcodec,
          acodec: f.acodec,
        }));
    } catch (error) {
      console.error('Error fetching formats:', error);
      throw error;
    }
  }

  async startDownload(options: DownloadOptions): Promise<string> {
    const downloadId = uuidv4();

    const progress: DownloadProgress = {
      id: downloadId,
      url: options.url,
      progress: 0,
      speed: 0,
      eta: 0,
      status: 'pending',
    };

    this.downloads.set(downloadId, progress);

    try {
      const ytDlpArgs = [
        '--format',
        options.format || 'best',
        '--output',
        options.outputPath,
        '--newline',
        '--no-playlist',
      ];

      const ytDlpProcess = this.ytDlp.exec([options.url, ...ytDlpArgs]);
      this.activeProcesses.set(downloadId, ytDlpProcess);

      progress.status = 'downloading';
      this.downloads.set(downloadId, progress);

      ytDlpProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        const progressMatch = output.match(/(\d+\.?\d*)%/);
        const speedMatch = output.match(/([\d.]+)(K|M|G)iB\/s/);
        const etaMatch = output.match(/ETA\s+([\d:]+)/);

        if (progressMatch) {
          progress.progress = parseFloat(progressMatch[1]);
        }

        if (speedMatch) {
          const value = parseFloat(speedMatch[1]);
          const unit = speedMatch[2];
          const multiplier = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 }[unit] || 1;
          progress.speed = value * multiplier;
        }

        if (etaMatch) {
          progress.eta = this.parseETA(etaMatch[1]);
        }

        this.downloads.set(downloadId, progress);
        options.onProgress?.(progress);
        this.emit('progress', downloadId, progress);
      });

      ytDlpProcess.on('close', (code: number) => {
        this.activeProcesses.delete(downloadId);

        if (code === 0) {
          progress.status = 'completed';
          progress.progress = 100;
          options.onComplete?.();
          this.emit('complete', downloadId);
        } else {
          progress.status = 'error';
          progress.error = `Download failed with code ${code}`;
          options.onError?.(new Error(progress.error));
          this.emit('error', downloadId, progress.error);
        }

        this.downloads.set(downloadId, progress);
      });

      ytDlpProcess.on('error', (error: Error) => {
        progress.status = 'error';
        progress.error = error.message;
        this.downloads.set(downloadId, progress);
        options.onError?.(error);
        this.emit('error', downloadId, error);
      });

    } catch (error) {
      progress.status = 'error';
      progress.error = (error as Error).message;
      this.downloads.set(downloadId, progress);
      throw error;
    }

    return downloadId;
  }

  cancelDownload(downloadId: string): void {
    const process = this.activeProcesses.get(downloadId);
    if (process) {
      process.kill();
      this.activeProcesses.delete(downloadId);

      const progress = this.downloads.get(downloadId);
      if (progress) {
        progress.status = 'canceled';
        this.downloads.set(downloadId, progress);
      }
    }
  }

  getDownload(downloadId: string): DownloadProgress | undefined {
    return this.downloads.get(downloadId);
  }

  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values()).filter(
      (d) => d.status === 'downloading' || d.status === 'pending'
    );
  }

  getAllDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values());
  }

  private parseETA(etaString: string): number {
    const parts = etaString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }
}

// Singleton instance
export const downloadManager = new DownloadManager();
```

### Step 3: Update IPC Handlers

Update `src/main/ipc-handlers.ts`:

```typescript
import { ipcMain, dialog, app } from 'electron';
import { selectVideoFile, getVideoMetadata, getVideoFileUrl } from './file-manager';
import { downloadManager } from './download-manager';
import path from 'path';

export function setupIpcHandlers() {
  // Existing handlers...
  ipcMain.handle('ping', async () => 'pong');

  ipcMain.handle('select-video-file', async () => {
    const filePath = await selectVideoFile();
    if (!filePath) return null;

    const metadata = await getVideoMetadata(filePath);
    const url = getVideoFileUrl(filePath);

    return { ...metadata, url };
  });

  // Download location
  ipcMain.handle('select-download-location', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Location',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('get-default-download-location', async () => {
    return app.getPath('videos');
  });

  // URL validation
  ipcMain.handle('validate-url', async (event, url: string) => {
    const isValid = downloadManager.validateUrl(url);
    const source = isValid ? downloadManager.detectSource(url) : null;

    return { isValid, source };
  });

  // Fetch video formats
  ipcMain.handle('fetch-video-formats', async (event, url: string) => {
    try {
      const formats = await downloadManager.fetchFormats(url);
      return { success: true, formats };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Start download
  ipcMain.handle('start-download', async (event, options: {
    url: string;
    downloadPath: string;
    filename: string;
    format: string;
  }) => {
    const outputPath = path.join(options.downloadPath, options.filename);

    try {
      const downloadId = await downloadManager.startDownload({
        url: options.url,
        outputPath,
        format: options.format,
        onProgress: (progress) => {
          event.sender.send('download-progress', downloadId, progress);
        },
        onComplete: () => {
          event.sender.send('download-complete', downloadId, outputPath);
        },
        onError: (error) => {
          event.sender.send('download-error', downloadId, error.message);
        },
      });

      return { success: true, downloadId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Cancel download
  ipcMain.handle('cancel-download', async (event, downloadId: string) => {
    downloadManager.cancelDownload(downloadId);
    return { success: true };
  });

  // Get download status
  ipcMain.handle('get-download-status', async (event, downloadId: string) => {
    const download = downloadManager.getDownload(downloadId);
    return download || null;
  });

  // Get all downloads
  ipcMain.handle('get-all-downloads', async () => {
    return downloadManager.getAllDownloads();
  });
}
```

### Step 4: Update Preload API

Update `src/preload/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
  video: {
    selectFile: () => ipcRenderer.invoke('select-video-file'),
    getMetadata: (path: string) => ipcRenderer.invoke('get-video-metadata', path),
  },
  download: {
    selectLocation: () => ipcRenderer.invoke('select-download-location'),
    getDefaultLocation: () => ipcRenderer.invoke('get-default-download-location'),
    validateUrl: (url: string) => ipcRenderer.invoke('validate-url', url),
    fetchFormats: (url: string) => ipcRenderer.invoke('fetch-video-formats', url),
    start: (options: any) => ipcRenderer.invoke('start-download', options),
    cancel: (id: string) => ipcRenderer.invoke('cancel-download', id),
    getStatus: (id: string) => ipcRenderer.invoke('get-download-status', id),
    getAll: () => ipcRenderer.invoke('get-all-downloads'),
    onProgress: (callback: (id: string, progress: any) => void) => {
      ipcRenderer.on('download-progress', (event, id, progress) => callback(id, progress));
    },
    onComplete: (callback: (id: string, path: string) => void) => {
      ipcRenderer.on('download-complete', (event, id, path) => callback(id, path));
    },
    onError: (callback: (id: string, error: string) => void) => {
      ipcRenderer.on('download-error', (event, id, error) => callback(id, error));
    },
  },
});
```

### Step 5: Create URL Input Component

Create `src/renderer/components/UrlInput.tsx`:

```typescript
import { useState } from 'react';
import './UrlInput.css';

interface UrlInputProps {
  onUrlValidated: (url: string, source: string) => void;
}

export function UrlInput({ onUrlValidated }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [source, setSource] = useState('');

  const handleValidate = async () => {
    setError('');
    setIsValid(false);
    setIsValidating(true);

    try {
      const result = await window.electron.download.validateUrl(url);

      if (result.isValid) {
        setIsValid(true);
        setSource(result.source);
        onUrlValidated(url, result.source);
      } else {
        setError('Invalid URL. Please enter a valid video URL.');
      }
    } catch (err) {
      setError('Error validating URL');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="url-input-container">
      <div className="url-input-group">
        <input
          type="text"
          data-testid="url-input"
          className="url-input"
          placeholder="Enter video URL (YouTube, Vimeo, or direct link)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
        />
        <button
          data-testid="validate-url-button"
          className="validate-button"
          onClick={handleValidate}
          disabled={!url || isValidating}
        >
          {isValidating ? 'Validating...' : 'Validate'}
        </button>
      </div>

      {isValid && (
        <div data-testid="url-valid-indicator" className="url-status valid">
          ✓ Valid URL detected
          <span data-testid="source-type" className="source-type">
            Source: {source}
          </span>
        </div>
      )}

      {error && (
        <div data-testid="url-error-message" className="url-status error">
          {error}
        </div>
      )}
    </div>
  );
}
```

Create `src/renderer/components/UrlInput.css`:

```css
.url-input-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid #444;
  border-radius: 8px;
  background: #2a2a2a;
  color: white;
}

.url-input:focus {
  outline: none;
  border-color: #0066ff;
}

.validate-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  background: #0066ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.validate-button:hover:not(:disabled) {
  background: #0052cc;
}

.validate-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.url-status {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.url-status.valid {
  background: #1a4d2e;
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-status.error {
  background: #4d1a1a;
  color: #f87171;
}

.source-type {
  margin-left: auto;
  font-weight: 600;
  text-transform: capitalize;
}
```

### Step 6: Create Quality Selector Component

Create `src/renderer/components/QualitySelector.tsx`:

```typescript
import { useState, useEffect } from 'react';
import './QualitySelector.css';

interface QualitySelectorProps {
  url: string;
  onQualitySelected: (format: string, formatInfo: any) => void;
}

export function QualitySelector({ url, onQualitySelected }: QualitySelectorProps) {
  const [formats, setFormats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  const fetchQualities = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await window.electron.download.fetchFormats(url);

      if (result.success) {
        setFormats(result.formats);
        if (result.formats.length > 0) {
          const bestFormat = result.formats[0].format_id;
          setSelectedFormat(bestFormat);
          onQualitySelected(bestFormat, result.formats[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch formats');
      }
    } catch (err) {
      setError('Error fetching video formats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatChange = (formatId: string) => {
    setSelectedFormat(formatId);
    const format = formats.find((f) => f.format_id === formatId);
    if (format) {
      onQualitySelected(formatId, format);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="quality-selector-container">
      <button
        data-testid="fetch-qualities-button"
        className="fetch-button"
        onClick={fetchQualities}
        disabled={isLoading}
      >
        {isLoading ? 'Fetching Formats...' : 'Fetch Available Qualities'}
      </button>

      {error && <div className="quality-error">{error}</div>}

      {formats.length > 0 && (
        <div className="quality-list">
          <label htmlFor="quality-selector">Select Quality:</label>
          <select
            id="quality-selector"
            data-testid="quality-selector"
            value={selectedFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="quality-select"
          >
            {formats.map((format) => (
              <option
                key={format.format_id}
                value={format.format_id}
                data-testid="quality-option"
              >
                {format.resolution} - {format.ext.toUpperCase()}
                {format.format_note && ` (${format.format_note})`}
                {' - '}
                {formatFileSize(format.filesize)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

Create `src/renderer/components/QualitySelector.css`:

```css
.quality-selector-container {
  width: 100%;
  max-width: 800px;
  margin: 1rem auto;
}

.fetch-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  background: #0066ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.fetch-button:hover:not(:disabled) {
  background: #0052cc;
}

.fetch-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.quality-error {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #4d1a1a;
  color: #f87171;
  border-radius: 4px;
}

.quality-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quality-list label {
  font-size: 0.9rem;
  color: #ccc;
}

.quality-select {
  padding: 0.75rem;
  font-size: 1rem;
  background: #2a2a2a;
  color: white;
  border: 2px solid #444;
  border-radius: 8px;
  cursor: pointer;
}

.quality-select:focus {
  outline: none;
  border-color: #0066ff;
}
```

(Continued in next message due to length...)

---

## Acceptance Criteria

- [ ] URL input validates YouTube and direct video URLs
- [ ] Source type detected correctly (YouTube, Vimeo, direct)
- [ ] Available quality options fetched from yt-dlp
- [ ] User can select download quality/format
- [ ] User can select custom download location
- [ ] Download starts and shows progress (percentage, speed, ETA)
- [ ] Downloaded video can be played in the player
- [ ] Download can be canceled
- [ ] Multiple simultaneous downloads supported
- [ ] All Playwright E2E tests pass
- [ ] All Vitest unit tests pass
- [ ] Error handling for invalid URLs and failed downloads

---

## Test Execution

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e -- e2e/downloads.spec.ts

# Run all tests
npm test && npm run test:e2e
```

---

## Success Metrics

1. **All tests green**: 100% pass rate
2. **Download accuracy**: Files download correctly from multiple sources
3. **Progress tracking**: Real-time updates during download
4. **Error resilience**: Graceful handling of network/URL errors
5. **Multi-source support**: Works with YouTube and other platforms

---

## Next Phase

Once all tests pass and acceptance criteria are met, proceed to [Phase 4: Progressive Playback](./phase4-progressive.md).
