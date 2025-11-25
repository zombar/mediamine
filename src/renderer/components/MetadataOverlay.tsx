import './MetadataOverlay.css';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

interface VideoData {
  filename: string;
  format: string;
  size: number;
}

interface MetadataOverlayProps {
  metadata: VideoMetadata;
  videoData: VideoData;
  onClose: () => void;
}

export function MetadataOverlay({ metadata, videoData, onClose }: MetadataOverlayProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="metadata-overlay-backdrop" onClick={onClose}>
      <div className="metadata-overlay" onClick={(e) => e.stopPropagation()}>
        <h3>Video Information</h3>

        <div className="metadata-grid">
          <div className="metadata-row">
            <span className="metadata-label">Filename</span>
            <span className="metadata-value">{videoData.filename}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Duration</span>
            <span className="metadata-value">{formatDuration(metadata.duration)}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Resolution</span>
            <span className="metadata-value">{metadata.width} × {metadata.height}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Format</span>
            <span className="metadata-value">{videoData.format.toUpperCase()}</span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">File Size</span>
            <span className="metadata-value">{formatFileSize(videoData.size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
