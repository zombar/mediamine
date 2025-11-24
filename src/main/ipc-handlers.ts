import { ipcMain } from 'electron';

export function setupIpcHandlers() {
  // Ping-pong test handler
  ipcMain.handle('ping', async () => {
    return 'pong';
  });

  // Add more handlers as needed in future phases
}
