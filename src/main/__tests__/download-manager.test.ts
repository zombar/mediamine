import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock yt-dlp-wrap before importing DownloadManager
vi.mock('yt-dlp-wrap', () => {
  return {
    default: class MockYTDlpWrap {
      async getVideoInfo() {
        return { formats: [] };
      }
      exec() {
        return {
          stdout: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };
      }
    },
  };
});

import { DownloadManager } from '../download-manager';

describe('DownloadManager', () => {
  let manager: DownloadManager;

  beforeEach(() => {
    manager = new DownloadManager();
  });

  describe('validateUrl', () => {
    it('should validate YouTube URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const isValid = manager.validateUrl(url);
      expect(isValid).toBe(true);
    });

    it('should validate direct video URLs', () => {
      const url = 'https://example.com/video.mp4';
      const isValid = manager.validateUrl(url);
      expect(isValid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const url = 'not-a-url';
      const isValid = manager.validateUrl(url);
      expect(isValid).toBe(false);
    });

    it('should reject non-http protocols', () => {
      const url = 'ftp://example.com/video.mp4';
      const isValid = manager.validateUrl(url);
      expect(isValid).toBe(false);
    });
  });

  describe('detectSource', () => {
    it('should detect YouTube as source', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const source = manager.detectSource(url);
      expect(source).toBe('youtube');
    });

    it('should detect youtu.be as YouTube source', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const source = manager.detectSource(url);
      expect(source).toBe('youtube');
    });

    it('should detect direct video URLs', () => {
      const url = 'https://example.com/video.mp4';
      const source = manager.detectSource(url);
      expect(source).toBe('direct');
    });

    it('should detect direct WebM URLs', () => {
      const url = 'https://example.com/video.webm';
      const source = manager.detectSource(url);
      expect(source).toBe('direct');
    });

    it('should detect other sources', () => {
      const url = 'https://vimeo.com/123456';
      const source = manager.detectSource(url);
      expect(source).toBe('other');
    });
  });

  describe('getActiveDownloads', () => {
    it('should return empty array when no downloads', () => {
      const downloads = manager.getActiveDownloads();
      expect(downloads).toEqual([]);
    });
  });

  describe('getAllDownloads', () => {
    it('should return empty array when no downloads', () => {
      const downloads = manager.getAllDownloads();
      expect(downloads).toEqual([]);
    });
  });

  describe('getDownload', () => {
    it('should return undefined for non-existent download', () => {
      const download = manager.getDownload('non-existent-id');
      expect(download).toBeUndefined();
    });
  });

  describe('cancelDownload', () => {
    it('should not throw error for non-existent download', () => {
      expect(() => {
        manager.cancelDownload('non-existent-id');
      }).not.toThrow();
    });
  });
});
