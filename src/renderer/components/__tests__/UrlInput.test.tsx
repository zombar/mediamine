import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UrlInput } from '../UrlInput';

const mockValidateUrl = vi.fn();
const mockFetchFormats = vi.fn();
const mockStart = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(window, {
    electron: {
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
      download: {
        validateUrl: mockValidateUrl,
        fetchFormats: mockFetchFormats,
        start: mockStart,
      },
    },
  });
});

describe('UrlInput Component', () => {
  it('should render input field', () => {
    const onDownloadStart = vi.fn();
    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
  });

  it('should render download button', () => {
    const onDownloadStart = vi.fn();
    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);
    expect(screen.getByTestId('download-button')).toBeInTheDocument();
  });

  it('should start download on button click', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });
    mockFetchFormats.mockResolvedValue([
      { format_id: '137', ext: 'mp4', resolution: '1080p', vcodec: 'avc1', acodec: 'mp4a', filesize: 1000000 },
    ]);

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onDownloadStart).toHaveBeenCalled();
      const [url, format, filename] = onDownloadStart.mock.calls[0];
      expect(url).toBe('https://youtube.com/watch?v=test');
      expect(format).toBe('137');
      expect(filename).toMatch(/^video_\d+\.mp4$/);
    });
  });

  it('should show error for invalid URL', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: false, source: null });

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'invalid' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByTestId('url-error-message')).toBeInTheDocument();
    });
  });

  it('should show error when no formats found', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });
    mockFetchFormats.mockResolvedValue([]);

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByTestId('url-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('url-error-message')).toHaveTextContent('No downloadable formats found');
    });
  });

  it('should disable button when URL is empty', () => {
    const onDownloadStart = vi.fn();
    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const downloadButton = screen.getByTestId('download-button');
    expect(downloadButton).toBeDisabled();
  });

  it('should show loading states during download process', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockImplementation(() => new Promise((resolve) => globalThis.setTimeout(() => resolve({ isValid: true, source: 'youtube' }), 50)));
    mockFetchFormats.mockImplementation(() => new Promise((resolve) => globalThis.setTimeout(() => resolve([
      { format_id: '137', ext: 'mp4', resolution: '1080p', vcodec: 'avc1', acodec: 'mp4a', filesize: 1000000 },
    ]), 50)));

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    // Should show validating state
    expect(downloadButton).toHaveTextContent('Validating...');

    // Wait for fetching state
    await waitFor(() => {
      expect(downloadButton).toHaveTextContent('Fetching formats...');
    });

    // Wait for starting state
    await waitFor(() => {
      expect(downloadButton).toHaveTextContent('Starting download...');
    });
  });

  it('should clear URL after successful download start', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });
    mockFetchFormats.mockResolvedValue([
      { format_id: '137', ext: 'mp4', resolution: '1080p', vcodec: 'avc1', acodec: 'mp4a', filesize: 1000000 },
    ]);

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input') as globalThis.HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should select best format with video and audio', async () => {
    const onDownloadStart = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });
    mockFetchFormats.mockResolvedValue([
      { format_id: '136', ext: 'mp4', resolution: '720p', vcodec: 'avc1', acodec: 'none', filesize: 500000 },
      { format_id: '137', ext: 'mp4', resolution: '1080p', vcodec: 'avc1', acodec: 'mp4a', filesize: 1000000 },
      { format_id: '138', ext: 'mp4', resolution: '1080p', vcodec: 'avc1', acodec: 'mp4a', filesize: 800000 },
    ]);

    render(<UrlInput onDownloadStart={onDownloadStart} downloadLocation="/downloads" />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onDownloadStart).toHaveBeenCalled();
      const [, format] = onDownloadStart.mock.calls[0];
      // Should select 137 (largest filesize with both video and audio)
      expect(format).toBe('137');
    });
  });
});
