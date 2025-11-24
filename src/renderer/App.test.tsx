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
    render(<App />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('should display application name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Vidmin/i })).toBeInTheDocument();
  });

  it('should render main container', () => {
    render(<App />);
    expect(screen.getByTestId('main-container')).toBeInTheDocument();
  });

  it('should display mode selector', () => {
    render(<App />);
    expect(screen.getByText(/Local File/i)).toBeInTheDocument();
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
  });
});
