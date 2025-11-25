import IconButton from '@mui/material/IconButton';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './ProgressModal.css';

interface DownloadProgress {
  id: string;
  url: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'canceled';
  filename?: string;
  error?: string;
}

interface ProgressModalProps {
  mode: 'download' | 'conversion';
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onCancel: () => void;

  // Download mode props
  downloadProgress?: DownloadProgress;
  onPlayDownloaded?: () => void;

  // Conversion mode props
  conversionProgress?: number;
  conversionStatus?: 'idle' | 'loading' | 'converting' | 'completed' | 'error';
  conversionError?: string;
  inputFormat?: string;
  inputPath?: string;
  outputFormat?: 'mp4' | 'webm';
  quality?: 'high' | 'medium' | 'low';
  onConvert?: (format: 'mp4' | 'webm', quality: 'high' | 'medium' | 'low') => void;
}

export function ProgressModal({
  mode,
  isMinimized,
  onMinimize,
  onMaximize,
  onClose,
  onCancel,
  downloadProgress,
  onPlayDownloaded,
  conversionProgress = 0,
  conversionStatus = 'idle',
  conversionError,
  inputFormat,
}: ProgressModalProps) {
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
  };

  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isMinimized) {
    // Minimized pill view
    const progress = mode === 'download'
      ? downloadProgress?.progress || 0
      : conversionProgress;

    return (
      <div className="progress-modal minimized" onClick={onMaximize}>
        <div className="minimized-content">
          <span className="minimized-label">
            {mode === 'download' ? 'Downloading' : 'Converting'}
          </span>
          <div className="minimized-progress-bar">
            <div
              className="minimized-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="minimized-percentage">{Math.round(progress)}%</span>
        </div>
      </div>
    );
  }

  // Full modal view
  return (
    <div className="progress-modal-backdrop">
      <div className="progress-modal full">
        <div className="modal-header">
          <h3>{mode === 'download' ? 'Downloading Video' : 'Converting Video'}</h3>
          <div className="modal-header-actions">
            <IconButton onClick={onMinimize} size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <MinimizeIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        <div className="modal-content">
          {mode === 'download' && downloadProgress && (
            <>
              <div className="info-row">
                <span className="info-label">File:</span>
                <span className="info-value">{downloadProgress.filename || 'Preparing...'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">URL:</span>
                <span className="info-value url">{downloadProgress.url}</span>
              </div>

              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${downloadProgress.status}`}
                    style={{ width: `${downloadProgress.progress}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <span>{Math.round(downloadProgress.progress)}%</span>
                  {downloadProgress.status === 'downloading' && (
                    <span>
                      {formatSpeed(downloadProgress.speed)} · ETA: {formatETA(downloadProgress.eta)}
                    </span>
                  )}
                </div>
              </div>

              {downloadProgress.status === 'error' && downloadProgress.error && (
                <div className="error-message">
                  <strong>Error:</strong> {downloadProgress.error}
                </div>
              )}

              {downloadProgress.status === 'completed' && (
                <div className="success-message">
                  Download completed successfully!
                </div>
              )}

              <div className="modal-actions">
                {downloadProgress.status === 'completed' && onPlayDownloaded && (
                  <button className="btn-primary" onClick={onPlayDownloaded}>
                    <PlayArrowIcon sx={{ mr: 0.5 }} />
                    Play Video
                  </button>
                )}
                {downloadProgress.status === 'downloading' && (
                  <button className="btn-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                )}
                {(downloadProgress.status === 'error' || downloadProgress.status === 'completed') && (
                  <button className="btn-secondary" onClick={onClose}>
                    Close
                  </button>
                )}
              </div>
            </>
          )}

          {mode === 'conversion' && (
            <>
              <div className="info-row">
                <span className="info-label">Format:</span>
                <span className="info-value">{inputFormat?.toUpperCase()}</span>
              </div>

              {conversionStatus === 'idle' && (
                <div className="info-message">
                  This video format needs to be converted to play in the browser.
                </div>
              )}

              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${conversionStatus}`}
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <span>{Math.round(conversionProgress)}%</span>
                  {conversionStatus === 'loading' && <span>Loading FFmpeg...</span>}
                  {conversionStatus === 'converting' && <span>Converting...</span>}
                </div>
              </div>

              {conversionStatus === 'error' && conversionError && (
                <div className="error-message">
                  <strong>Error:</strong> {conversionError}
                </div>
              )}

              <div className="modal-actions">
                {(conversionStatus === 'converting' || conversionStatus === 'loading') && (
                  <button className="btn-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                )}
                {conversionStatus === 'error' && (
                  <button className="btn-secondary" onClick={onClose}>
                    Close
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
