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

      if (result.isValid && result.source) {
        setIsValid(true);
        setSource(result.source);
        onUrlValidated(url, result.source);
      } else {
        setError('Invalid URL. Please enter a valid video URL.');
      }
    } catch {
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
