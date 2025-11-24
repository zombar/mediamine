import { useState, useEffect } from 'react';
import { FileSelector } from './components/FileSelector';
import { VideoPlayer } from './components/VideoPlayer';
import { UrlInput } from './components/UrlInput';
import { QualitySelector } from './components/QualitySelector';
import { DownloadProgress } from './components/DownloadProgress';
import type { VideoFileData, DownloadProgress as DownloadProgressType, VideoFormat } from '../preload/preload.d';
import './App.css';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

type Mode = 'local' | 'download';

function App() {
  const [mode, setMode] = useState<Mode>('local');
  const [videoData, setVideoData] = useState<any>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Download state
  const [downloadUrl, setDownloadUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [downloadLocation, setDownloadLocation] = useState('');
  const [currentDownload, setCurrentDownload] = useState<DownloadProgressType | null>(null);
  const [downloads, setDownloads] = useState<DownloadProgressType[]>([]);
  const [ytDlpInstalled, setYtDlpInstalled] = useState(true);

  useEffect(() => {
    // Check if yt-dlp is installed
    window.electron.download.checkYtDlp().then(({ isInstalled }: { isInstalled: boolean }) => {
      setYtDlpInstalled(isInstalled);
    });

    // Get default download location
    window.electron.download.getDefaultLocation().then((location: string) => {
      setDownloadLocation(location);
    });

    // Set up download progress listeners
    const cleanupProgress = window.electron.download.onProgress((id: string, progress: DownloadProgressType) => {
      setCurrentDownload(progress);
      setDownloads((prev) => {
        const index = prev.findIndex((d) => d.id === id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = progress;
          return updated;
        }
        return [...prev, progress];
      });
    });

    const cleanupComplete = window.electron.download.onComplete((id: string, _path: string) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'completed' as const, progress: 100 } : d))
      );
    });

    const cleanupError = window.electron.download.onError((id: string, error: string) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'error' as const, error } : d))
      );
    });

    return () => {
      cleanupProgress();
      cleanupComplete();
      cleanupError();
    };
  }, []);

  const handleFileSelected = (fileData: VideoFileData | null) => {
    setVideoData(fileData);
    setMetadata(null);
  };

  const handleMetadataLoad = (meta: VideoMetadata) => {
    setMetadata(meta);
  };

  const handleUrlValidated = (url: string, _source: string) => {
    setDownloadUrl(url);
  };

  const handleQualitySelected = (format: string, _formatInfo: VideoFormat) => {
    setSelectedFormat(format);
  };

  const handleSelectDownloadLocation = async (): Promise<void> => {
    const location = await window.electron.download.selectLocation();
    if (location) {
      setDownloadLocation(location);
    }
  };

  const handleStartDownload = async () => {
    if (!downloadUrl || !selectedFormat || !downloadLocation) {
      return;
    }

    const filename = `video_${Date.now()}.mp4`;
    const result = await window.electron.download.start({
      url: downloadUrl,
      downloadPath: downloadLocation,
      filename,
      format: selectedFormat,
    });

    if (result.success && result.downloadId) {
      const progress: DownloadProgressType = {
        id: result.downloadId,
        url: downloadUrl,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'pending',
        filename,
      };
      setCurrentDownload(progress);
      setDownloads([...downloads, progress]);
    }
  };

  const handleCancelDownload = async () => {
    if (currentDownload) {
      await window.electron.download.cancel(currentDownload.id);
    }
  };

  const handlePlayDownloaded = () => {
    // TODO: Load the downloaded video into the player
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="app">
      <header data-testid="app-header" className="app-header">
        <h1>Vidmin Video Player</h1>
        {videoData && (
          <button
            onClick={() => setVideoData(null)}
            className="change-file-button"
            data-testid="change-file-button"
          >
            Change File
          </button>
        )}
      </header>

      {!videoData && (
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'local' ? 'active' : ''}`}
            onClick={() => setMode('local')}
          >
            Local File
          </button>
          <button
            className={`mode-button ${mode === 'download' ? 'active' : ''}`}
            onClick={() => setMode('download')}
          >
            Download
          </button>
        </div>
      )}

      <main data-testid="main-container" className="main-container">
        {!videoData ? (
          <>
            {mode === 'local' ? (
              <FileSelector onFileSelected={handleFileSelected} />
            ) : (
              <div className="download-container">
                {!ytDlpInstalled && (
                  <div className="yt-dlp-warning" data-testid="yt-dlp-warning">
                    <h3>yt-dlp is not installed</h3>
                    <p>To download videos, you need to install yt-dlp:</p>
                    <ul>
                      <li>macOS/Linux: <code>brew install yt-dlp</code> or <code>pip install yt-dlp</code></li>
                      <li>Windows: Download from <a href="https://github.com/yt-dlp/yt-dlp/releases" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                    </ul>
                  </div>
                )}
                <UrlInput onUrlValidated={handleUrlValidated} />

                {downloadUrl && (
                  <QualitySelector url={downloadUrl} onQualitySelected={handleQualitySelected} />
                )}

                {downloadUrl && selectedFormat && (
                  <div className="download-location-container">
                    <label>Download Location:</label>
                    <div className="location-selector">
                      <span data-testid="download-location-display" className="location-path">
                        {downloadLocation}
                      </span>
                      <button
                        data-testid="select-download-location"
                        onClick={handleSelectDownloadLocation}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {downloadUrl && selectedFormat && !currentDownload && (
                  <button
                    data-testid="start-download-button"
                    className="start-download-button"
                    onClick={handleStartDownload}
                  >
                    Start Download
                  </button>
                )}

                {currentDownload && (
                  <DownloadProgress
                    progress={currentDownload.progress}
                    speed={currentDownload.speed}
                    eta={currentDownload.eta}
                    status={currentDownload.status}
                    filename={currentDownload.filename}
                    error={currentDownload.error}
                    onCancel={handleCancelDownload}
                    onPlayDownloaded={handlePlayDownloaded}
                  />
                )}

                {downloads.length > 0 && (
                  <div className="download-list" data-testid="download-list">
                    <h3>Downloads</h3>
                    {downloads.map((download) => (
                      <div key={download.id} className="download-item" data-testid="download-item">
                        <span>{download.filename || 'Unknown'}</span>
                        <span data-testid="download-status">{download.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <VideoPlayer
              videoUrl={videoData.url}
              filename={videoData.filename}
              onMetadataLoad={handleMetadataLoad}
            />
            {metadata && (
              <div className="video-metadata" data-testid="video-metadata-panel">
                <div className="metadata-item">
                  <span className="metadata-label">Duration</span>
                  <span className="metadata-value" data-testid="video-duration">
                    {formatDuration(metadata.duration)}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Resolution</span>
                  <span className="metadata-value" data-testid="video-resolution">
                    {metadata.width} x {metadata.height}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Format</span>
                  <span className="metadata-value" data-testid="video-format">
                    {videoData.format.toUpperCase()}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Size</span>
                  <span className="metadata-value" data-testid="video-size">
                    {formatFileSize(videoData.size)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
