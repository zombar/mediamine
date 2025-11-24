import { useState } from 'react';
import type { VideoFormat } from '../../preload/preload.d';
import './UrlInput.css';

interface UrlInputProps {
  onDownloadStart: (url: string, format: string, filename: string) => Promise<void>;
  downloadLocation: string;
  disabled?: boolean;
}

type DownloadState = 'idle' | 'validating' | 'fetching' | 'starting';

export function UrlInput({ onDownloadStart, downloadLocation, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<DownloadState>('idle');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!url || !downloadLocation) {
      setError('Please enter a URL and select a download location');
      return;
    }

    setError('');
    setState('validating');

    try {
      // Step 1: Validate URL
      const result = await window.electron.download.validateUrl(url);

      if (!result.isValid) {
        setError('Invalid URL. Please enter a valid video URL.');
        setState('idle');
        return;
      }

      // Step 2: Fetch available formats
      setState('fetching');
      const formats: VideoFormat[] = await window.electron.download.fetchFormats(url);

      if (!formats || formats.length === 0) {
        setError('No downloadable formats found for this URL');
        setState('idle');
        return;
      }

      // Step 3: Select best format (prefer best quality with both video and audio)
      const bestFormat = selectBestFormat(formats);

      // Step 4: Start download
      setState('starting');

      // Generate filename from timestamp (called inside event handler, not during render)
      // eslint-disable-next-line react-hooks/purity
      const filename = `video_${Date.now()}.${bestFormat.ext || 'mp4'}`;
      await onDownloadStart(url, bestFormat.format_id, filename);

      // Clear URL and reset state after successful start
      setUrl('');
      setState('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error starting download';
      setError(errorMessage);
      setState('idle');
    }
  };

  const selectBestFormat = (formats: VideoFormat[]): VideoFormat => {
    // Prefer formats with both video and audio
    const withBoth = formats.filter(f =>
      f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none'
    );

    if (withBoth.length > 0) {
      // Sort by filesize (largest first) or take first if no filesize info
      withBoth.sort((a, b) => (b.filesize || 0) - (a.filesize || 0));
      return withBoth[0];
    }

    // Fall back to first available format
    return formats[0];
  };

  const getButtonText = () => {
    switch (state) {
      case 'validating': return 'Validating...';
      case 'fetching': return 'Fetching formats...';
      case 'starting': return 'Starting download...';
      default: return 'Download';
    }
  };

  const isButtonDisabled = !url || state !== 'idle' || disabled;

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
          onKeyPress={(e) => e.key === 'Enter' && !isButtonDisabled && handleDownload()}
          disabled={disabled}
        />
        <button
          data-testid="download-button"
          className="download-button"
          onClick={handleDownload}
          disabled={isButtonDisabled}
        >
          {getButtonText()}
        </button>
      </div>

      {error && (
        <div data-testid="url-error-message" className="url-status error">
          {error}
        </div>
      )}
    </div>
  );
}
