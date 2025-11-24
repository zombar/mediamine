import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { setupIpcHandlers } from './ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

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
