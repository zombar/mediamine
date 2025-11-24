import { vi } from 'vitest';

export default class MockYTDlpWrap {
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
}
