import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';

// Mock main module to prevent app initialization
vi.mock('./main', () => ({
  getMainWindow: vi.fn().mockReturnValue({
    getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    setAspectRatio: vi.fn(),
    setSize: vi.fn(),
    center: vi.fn(),
  }),
}));

// Mock yt-dlp-wrap before importing modules that depend on it
vi.mock('yt-dlp-wrap', () => {
  return {
    default: class MockYTDlpWrap {
      async getVideoInfo() {
        return { formats: [] };
      }
      exec() {
        return {
          stdout: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };
      }
    },
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/default/path'),
    whenReady: vi.fn().mockResolvedValue(undefined),
  },
  screen: {
    getDisplayNearestPoint: vi.fn().mockReturnValue({
      workArea: {
        width: 1920,
        height: 1080,
      },
    }),
  },
  protocol: {
    registerSchemesAsPrivileged: vi.fn(),
    registerFileProtocol: vi.fn(),
    handle: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

import { setupIpcHandlers } from './ipc-handlers';

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register ping handler', () => {
    setupIpcHandlers();

    expect(ipcMain.handle).toHaveBeenCalledWith('ping', expect.any(Function));
  });

  it('should respond with pong to ping', async () => {
    setupIpcHandlers();

    // Get the handler function that was registered
    const handleCall = (ipcMain.handle as any).mock.calls.find(
      (call: any) => call[0] === 'ping'
    );

    expect(handleCall).toBeDefined();

    const handler = handleCall[1];
    const result = await handler();

    expect(result).toBe('pong');
  });
});
