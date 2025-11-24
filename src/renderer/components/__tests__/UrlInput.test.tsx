import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UrlInput } from '../UrlInput';

const mockValidateUrl = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(window, {
    electron: {
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
      download: {
        validateUrl: mockValidateUrl,
      },
    },
  });
});

describe('UrlInput Component', () => {
  it('should render input field', () => {
    const onSubmit = vi.fn();
    render(<UrlInput onUrlValidated={onSubmit} />);
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
  });

  it('should render validate button', () => {
    const onSubmit = vi.fn();
    render(<UrlInput onUrlValidated={onSubmit} />);
    expect(screen.getByTestId('validate-url-button')).toBeInTheDocument();
  });

  it('should validate URL on button click', async () => {
    const onSubmit = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });

    render(<UrlInput onUrlValidated={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('https://youtube.com/watch?v=test', 'youtube');
    });
  });

  it('should show error for invalid URL', async () => {
    const onSubmit = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: false, source: null });

    render(<UrlInput onUrlValidated={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'invalid' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByTestId('url-error-message')).toBeInTheDocument();
    });
  });

  it('should show valid indicator for valid URL', async () => {
    const onSubmit = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });

    render(<UrlInput onUrlValidated={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByTestId('url-valid-indicator')).toBeInTheDocument();
    });
  });

  it('should display source type', async () => {
    const onSubmit = vi.fn();
    mockValidateUrl.mockResolvedValue({ isValid: true, source: 'youtube' });

    render(<UrlInput onUrlValidated={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    await waitFor(() => {
      const sourceType = screen.getByTestId('source-type');
      expect(sourceType).toHaveTextContent('youtube');
    });
  });

  it('should disable button when URL is empty', () => {
    const onSubmit = vi.fn();
    render(<UrlInput onUrlValidated={onSubmit} />);

    const validateButton = screen.getByTestId('validate-url-button');
    expect(validateButton).toBeDisabled();
  });

  it('should disable button while validating', async () => {
    const onSubmit = vi.fn();
    mockValidateUrl.mockImplementation(() => new Promise((resolve) => globalThis.setTimeout(() => resolve({ isValid: true, source: 'youtube' }), 100)));

    render(<UrlInput onUrlValidated={onSubmit} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });

    const validateButton = screen.getByTestId('validate-url-button');
    fireEvent.click(validateButton);

    expect(validateButton).toBeDisabled();
    expect(validateButton).toHaveTextContent('Validating...');
  });
});
