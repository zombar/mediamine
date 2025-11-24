import { useState } from 'react';
import './QualitySelector.css';

interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
  format_note?: string;
}

interface QualitySelectorProps {
  url: string;
  onQualitySelected: (format: string, formatInfo: VideoFormat) => void;
}

export function QualitySelector({ url, onQualitySelected }: QualitySelectorProps) {
  const [formats, setFormats] = useState<VideoFormat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  const fetchQualities = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await window.electron.download.fetchFormats(url);

      if (result.success && result.formats) {
        setFormats(result.formats);
        if (result.formats.length > 0) {
          const bestFormat = result.formats[0].format_id;
          setSelectedFormat(bestFormat);
          onQualitySelected(bestFormat, result.formats[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch formats');
      }
    } catch {
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
