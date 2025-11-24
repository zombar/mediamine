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
  };
});

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('should display application name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /MediaMine/i })).toBeInTheDocument();
  });

  it('should render main container', () => {
    render(<App />);
    expect(screen.getByTestId('main-container')).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to MediaMine/i)).toBeInTheDocument();
  });
});
