import './DownloadProgress.css';

interface DownloadProgressProps {
  progress: number;
  speed: number;
  eta: number;
  status?: 'pending' | 'downloading' | 'completed' | 'error' | 'canceled';
  filename?: string;
  error?: string;
  onCancel?: () => void;
  onPlayDownloaded?: () => void;
}

export function DownloadProgress({
  progress,
  speed,
  eta,
  status = 'downloading',
  filename,
  error,
  onCancel,
  onPlayDownloaded,
}: DownloadProgressProps) {
  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(0)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else if (bytesPerSecond < 1024 * 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
    }
  };

  const formatETA = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (status === 'completed') {
    return (
      <div className="download-progress-container" data-testid="download-progress">
        <div className="download-complete" data-testid="download-complete">
          <div className="complete-icon">✓</div>
          <div className="complete-message">Download Complete!</div>
          {filename && <div className="complete-filename">{filename}</div>}
          {onPlayDownloaded && (
            <button
              data-testid="play-downloaded-button"
              className="play-button"
              onClick={onPlayDownloaded}
            >
              Play Video
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="download-progress-container" data-testid="download-progress">
        <div className="download-error" data-testid="download-error">
          <div className="error-icon">✕</div>
          <div className="error-message">Download Failed</div>
          {error && <div className="error-details">{error}</div>}
        </div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="download-progress-container" data-testid="download-progress">
        <div className="download-status" data-testid="download-status">
          Download Canceled
        </div>
      </div>
    );
  }

  return (
    <div className="download-progress-container" data-testid="download-progress">
      <div className="progress-header">
        <span>Downloading{filename && `: ${filename}`}</span>
        {onCancel && (
          <button
            data-testid="cancel-download-button"
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-stats">
        <span data-testid="download-progress-percent" className="progress-percent">
          {progress.toFixed(1)}%
        </span>
        <span data-testid="download-speed" className="progress-speed">
          {formatSpeed(speed)}
        </span>
        <span data-testid="download-eta" className="progress-eta">
          ETA: {formatETA(eta)}
        </span>
      </div>
    </div>
  );
}
