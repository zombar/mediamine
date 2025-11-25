import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the electron API
beforeAll(() => {
  (window as any).electron = {
    ipcRenderer: {
      invoke: vi.fn().mockResolvedValue('pong'),
      on: vi.fn(),
      removeListener: vi.fn(),
    },
    video: {
      selectFile: vi.fn(),
      getMetadata: vi.fn(),
    },
    download: {
      selectLocation: vi.fn(),
      getDefaultLocation: vi.fn().mockResolvedValue('/default/downloads'),
      checkYtDlp: vi.fn().mockResolvedValue({ isInstalled: true }),
      validateUrl: vi.fn(),
      fetchFormats: vi.fn(),
      start: vi.fn(),
      cancel: vi.fn(),
      getStatus: vi.fn(),
      getAll: vi.fn(),
      onProgress: vi.fn(() => () => {}),
      onComplete: vi.fn(() => () => {}),
      onError: vi.fn(() => () => {}),
    },
  };
});

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toBeInTheDocument();
  });

  it('should display empty state when no video loaded', () => {
    render(<App />);
    expect(screen.getByText(/Drop a video file or URL here/i)).toBeInTheDocument();
  });

  it('should render video container', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.video-container')).toBeInTheDocument();
  });
});
