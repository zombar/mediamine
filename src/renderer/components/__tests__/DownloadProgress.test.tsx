import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DownloadProgress } from '../DownloadProgress';

describe('DownloadProgress Component', () => {
  it('should display progress percentage', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    const percentElement = screen.getByTestId('download-progress-percent');
    expect(percentElement).toHaveTextContent('50.0%');
  });

  it('should display download speed in KB/s', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    const speedElement = screen.getByTestId('download-speed');
    expect(speedElement.textContent).toContain('KB/s');
  });

  it('should display download speed in MB/s', () => {
    render(<DownloadProgress progress={50} speed={1024 * 1024} eta={30} />);
    const speedElement = screen.getByTestId('download-speed');
    expect(speedElement.textContent).toContain('MB/s');
  });

  it('should display download speed in GB/s', () => {
    render(<DownloadProgress progress={50} speed={1024 * 1024 * 1024} eta={30} />);
    const speedElement = screen.getByTestId('download-speed');
    expect(speedElement.textContent).toContain('GB/s');
  });

  it('should display ETA', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    const etaElement = screen.getByTestId('download-eta');
    expect(etaElement).toBeInTheDocument();
    expect(etaElement.textContent).toContain('ETA:');
  });

  it('should format ETA in seconds', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    const etaElement = screen.getByTestId('download-eta');
    expect(etaElement.textContent).toContain('30s');
  });

  it('should format ETA in minutes', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={125} />);
    const etaElement = screen.getByTestId('download-eta');
    expect(etaElement.textContent).toContain('2m 5s');
  });

  it('should format ETA in hours', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={3665} />);
    const etaElement = screen.getByTestId('download-eta');
    expect(etaElement.textContent).toContain('1h 1m');
  });

  it('should show completion state', () => {
    render(<DownloadProgress progress={100} speed={0} eta={0} status="completed" />);
    expect(screen.getByTestId('download-complete')).toBeInTheDocument();
  });

  it('should show play button when completed', () => {
    const onPlay = vi.fn();
    render(<DownloadProgress progress={100} speed={0} eta={0} status="completed" onPlayDownloaded={onPlay} />);
    expect(screen.getByTestId('play-downloaded-button')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<DownloadProgress progress={50} speed={0} eta={0} status="error" error="Network error" />);
    expect(screen.getByTestId('download-error')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<DownloadProgress progress={50} speed={0} eta={0} status="error" error="Network error" />);
    const errorElement = screen.getByTestId('download-error');
    expect(errorElement.textContent).toContain('Network error');
  });

  it('should show canceled state', () => {
    render(<DownloadProgress progress={50} speed={0} eta={0} status="canceled" />);
    const statusElement = screen.getByTestId('download-status');
    expect(statusElement).toHaveTextContent('Download Canceled');
  });

  it('should show cancel button when downloading', () => {
    const onCancel = vi.fn();
    render(<DownloadProgress progress={50} speed={1024} eta={30} status="downloading" onCancel={onCancel} />);
    expect(screen.getByTestId('cancel-download-button')).toBeInTheDocument();
  });

  it('should display filename', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} filename="test-video.mp4" />);
    const progressElement = screen.getByTestId('download-progress');
    expect(progressElement.textContent).toContain('test-video.mp4');
  });

  it('should render progress bar', () => {
    render(<DownloadProgress progress={50} speed={1024} eta={30} />);
    expect(screen.getByTestId('download-progress')).toBeInTheDocument();
  });
});
