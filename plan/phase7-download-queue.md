# Phase 7: Download Queue Management

## Overview
Implement a comprehensive download queue system that allows users to manage multiple concurrent downloads with queue visualization, per-item controls, and batch operations.

## Dependencies
- Phase 6 (UI/UX Redesign) must be completed
- FloatingActionButtons system in place
- ProgressModal component implemented

## Goals
- Support multiple concurrent downloads (default: 3 simultaneous)
- Queue management UI with visibility into all downloads
- Per-download controls (pause, resume, cancel, retry)
- Batch operations (pause all, resume all, clear completed)
- Queue persistence across app restarts
- Queue FAB with badge showing active count

---

## Current Limitations

1. **Single Download**: Only one download can run at a time
2. **No History**: Completed downloads disappear from UI
3. **No Queue**: Can't add multiple downloads to process later
4. **No Persistence**: Download state lost on app restart
5. **Limited Control**: Can't pause/resume downloads

---

## Queue Architecture

### Queue State Structure
```typescript
interface QueuedDownload {
  id: string;
  url: string;
  outputPath: string;
  quality: string;
  status: 'queued' | 'downloading' | 'completed' | 'error' | 'paused' | 'canceled';
  progress: number;
  speed: number;
  eta: number;
  filename?: string;
  error?: string;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface QueueState {
  downloads: QueuedDownload[];
  maxConcurrent: number;
  activeCount: number;
}
```

---

## Implementation Steps

### Step 1: Enhance DownloadManager

**File**: `src/main/download-manager.ts`

**Add Queue Methods**:
```typescript
export class DownloadManager extends EventEmitter {
  private downloads: Map<string, DownloadProgress>;
  private activeProcesses: Map<string, any>;
  private queue: QueuedDownload[] = [];
  private maxConcurrent = 3;

  // Queue management methods
  queueDownload(options: DownloadOptions): string {
    const id = uuidv4();
    const queuedDownload: QueuedDownload = {
      id,
      url: options.url,
      outputPath: options.outputPath,
      quality: options.format || 'best',
      status: 'queued',
      progress: 0,
      speed: 0,
      eta: 0,
      addedAt: Date.now(),
    };

    this.queue.push(queuedDownload);
    this.emit('queue-updated', this.getQueueStatus());
    this.startNextDownload();
    return id;
  }

  private startNextDownload(): void {
    const activeCount = this.getActiveDownloadCount();
    if (activeCount >= this.maxConcurrent) return;

    const nextDownload = this.queue.find(d => d.status === 'queued');
    if (!nextDownload) return;

    nextDownload.status = 'downloading';
    nextDownload.startedAt = Date.now();

    this.startDownload({
      url: nextDownload.url,
      outputPath: nextDownload.outputPath,
      format: nextDownload.quality,
      onProgress: (progress) => {
        this.updateDownloadProgress(nextDownload.id, progress);
      },
      onComplete: () => {
        this.handleDownloadComplete(nextDownload.id);
      },
      onError: (error) => {
        this.handleDownloadError(nextDownload.id, error);
      },
    });
  }

  pauseDownload(id: string): void {
    const process = this.activeProcesses.get(id);
    if (process) {
      process.kill('SIGSTOP'); // Pause the yt-dlp process
      const download = this.queue.find(d => d.id === id);
      if (download) {
        download.status = 'paused';
        this.emit('queue-updated', this.getQueueStatus());
      }
    }
  }

  resumeDownload(id: string): void {
    const download = this.queue.find(d => d.id === id);
    if (download && download.status === 'paused') {
      download.status = 'queued';
      this.emit('queue-updated', this.getQueueStatus());
      this.startNextDownload();
    }
  }

  cancelDownload(id: string): void {
    const process = this.activeProcesses.get(id);
    if (process) {
      process.kill();
      this.activeProcesses.delete(id);
    }

    const download = this.queue.find(d => d.id === id);
    if (download) {
      download.status = 'canceled';
      this.emit('queue-updated', this.getQueueStatus());
      this.startNextDownload(); // Start next in queue
    }
  }

  retryDownload(id: string): void {
    const download = this.queue.find(d => d.id === id);
    if (download && download.status === 'error') {
      download.status = 'queued';
      download.error = undefined;
      this.emit('queue-updated', this.getQueueStatus());
      this.startNextDownload();
    }
  }

  removeFromQueue(id: string): void {
    const index = this.queue.findIndex(d => d.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.emit('queue-updated', this.getQueueStatus());
    }
  }

  clearCompleted(): void {
    this.queue = this.queue.filter(d => d.status !== 'completed');
    this.emit('queue-updated', this.getQueueStatus());
  }

  getQueueStatus(): QueueState {
    return {
      downloads: this.queue,
      maxConcurrent: this.maxConcurrent,
      activeCount: this.getActiveDownloadCount(),
    };
  }

  private getActiveDownloadCount(): number {
    return this.queue.filter(d => d.status === 'downloading').length;
  }

  private handleDownloadComplete(id: string): void {
    const download = this.queue.find(d => d.id === id);
    if (download) {
      download.status = 'completed';
      download.completedAt = Date.now();
      download.progress = 100;
      this.emit('queue-updated', this.getQueueStatus());
      this.startNextDownload(); // Start next in queue
    }
  }

  private handleDownloadError(id: string, error: Error): void {
    const download = this.queue.find(d => d.id === id);
    if (download) {
      download.status = 'error';
      download.error = error.message;
      this.emit('queue-updated', this.getQueueStatus());
      this.startNextDownload(); // Continue with next download
    }
  }
}
```

---

### Step 2: Add IPC Handlers for Queue

**File**: `src/main/ipc-handlers.ts`

**Add Queue Handlers**:
```typescript
export function setupIpcHandlers() {
  // ... existing handlers ...

  // Queue management
  ipcMain.handle('queue-download', async (_event, url: string, quality: string, outputPath: string) => {
    return downloadManager.queueDownload({ url, outputPath, format: quality });
  });

  ipcMain.handle('pause-download', async (_event, id: string) => {
    downloadManager.pauseDownload(id);
  });

  ipcMain.handle('resume-download', async (_event, id: string) => {
    downloadManager.resumeDownload(id);
  });

  ipcMain.handle('cancel-download', async (_event, id: string) => {
    downloadManager.cancelDownload(id);
  });

  ipcMain.handle('retry-download', async (_event, id: string) => {
    downloadManager.retryDownload(id);
  });

  ipcMain.handle('remove-from-queue', async (_event, id: string) => {
    downloadManager.removeFromQueue(id);
  });

  ipcMain.handle('clear-completed', async () => {
    downloadManager.clearCompleted();
  });

  ipcMain.handle('get-queue-status', async () => {
    return downloadManager.getQueueStatus();
  });

  // Listen to queue updates
  downloadManager.on('queue-updated', (queueState) => {
    // Send to all renderer windows
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('queue-updated', queueState);
      }
    });
  });
}
```

---

### Step 3: Update Preload API

**File**: `src/preload/preload.ts`

**Add Queue Methods**:
```typescript
const electronAPI = {
  // ... existing methods ...

  queue: {
    addDownload: (url: string, quality: string, outputPath: string) =>
      ipcRenderer.invoke('queue-download', url, quality, outputPath) as Promise<string>,

    pause: (id: string) =>
      ipcRenderer.invoke('pause-download', id) as Promise<void>,

    resume: (id: string) =>
      ipcRenderer.invoke('resume-download', id) as Promise<void>,

    cancel: (id: string) =>
      ipcRenderer.invoke('cancel-download', id) as Promise<void>,

    retry: (id: string) =>
      ipcRenderer.invoke('retry-download', id) as Promise<void>,

    remove: (id: string) =>
      ipcRenderer.invoke('remove-from-queue', id) as Promise<void>,

    clearCompleted: () =>
      ipcRenderer.invoke('clear-completed') as Promise<void>,

    getStatus: () =>
      ipcRenderer.invoke('get-queue-status') as Promise<QueueState>,

    onUpdate: (callback: (queueState: QueueState) => void) => {
      const listener = (_event: any, queueState: QueueState) => callback(queueState);
      ipcRenderer.on('queue-updated', listener);
      return () => ipcRenderer.removeListener('queue-updated', listener);
    },
  },
};
```

**Update Type Definitions** (`src/preload/preload.d.ts`):
```typescript
interface ElectronAPI {
  // ... existing properties ...

  queue: {
    addDownload: (url: string, quality: string, outputPath: string) => Promise<string>;
    pause: (id: string) => Promise<void>;
    resume: (id: string) => Promise<void>;
    cancel: (id: string) => Promise<void>;
    retry: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
    getStatus: () => Promise<QueueState>;
    onUpdate: (callback: (queueState: QueueState) => void) => () => void;
  };
}
```

---

### Step 4: Create DownloadQueuePanel Component

**File**: `src/renderer/components/DownloadQueuePanel.tsx`

**Component Design**:
- Slide-out panel from right side of screen
- Shows all downloads in queue with status
- Per-download controls based on status
- Batch operation buttons at top
- Scrollable list for many downloads

**Component Structure**:
```tsx
interface DownloadQueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queueState: QueueState;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onPlayDownload: (path: string) => void;
  onShowInFolder: (path: string) => void;
  onClearCompleted: () => void;
}

export function DownloadQueuePanel({
  isOpen,
  onClose,
  queueState,
  ...handlers
}: DownloadQueuePanelProps) {
  return (
    <div className={`queue-panel ${isOpen ? 'open' : ''}`}>
      <div className="queue-header">
        <h2>Download Queue ({queueState.activeCount} / {queueState.maxConcurrent})</h2>
        <div className="queue-actions">
          <button onClick={onClearCompleted}>Clear Completed</button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div className="queue-list">
        {queueState.downloads.map(download => (
          <DownloadQueueItem
            key={download.id}
            download={download}
            onPause={() => handlers.onPause(download.id)}
            onResume={() => handlers.onResume(download.id)}
            onCancel={() => handlers.onCancel(download.id)}
            onRetry={() => handlers.onRetry(download.id)}
            onRemove={() => handlers.onRemove(download.id)}
            onPlay={() => handlers.onPlayDownload(download.outputPath)}
            onShowInFolder={() => handlers.onShowInFolder(download.outputPath)}
          />
        ))}

        {queueState.downloads.length === 0 && (
          <div className="queue-empty">
            No downloads in queue
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 5: Create DownloadQueueItem Component

**File**: `src/renderer/components/DownloadQueueItem.tsx`

**Component Design**:
- Shows download filename, URL, progress
- Status indicator (icon + color)
- Action buttons based on status:
  - **Queued**: Cancel
  - **Downloading**: Pause, Cancel
  - **Paused**: Resume, Cancel
  - **Completed**: Play, Show in Folder, Remove
  - **Error**: Retry, Remove
  - **Canceled**: Remove

**Component Structure**:
```tsx
interface DownloadQueueItemProps {
  download: QueuedDownload;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
  onPlay: () => void;
  onShowInFolder: () => void;
}

export function DownloadQueueItem({
  download,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onPlay,
  onShowInFolder,
}: DownloadQueueItemProps) {
  const getStatusIcon = () => {
    switch (download.status) {
      case 'queued': return <HourglassEmptyIcon />;
      case 'downloading': return <CloudDownloadIcon />;
      case 'paused': return <PauseIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'error': return <ErrorIcon />;
      case 'canceled': return <CancelIcon />;
    }
  };

  const getActionButtons = () => {
    switch (download.status) {
      case 'queued':
        return <IconButton onClick={onCancel} size="small"><CloseIcon /></IconButton>;

      case 'downloading':
        return (
          <>
            <IconButton onClick={onPause} size="small"><PauseIcon /></IconButton>
            <IconButton onClick={onCancel} size="small"><CloseIcon /></IconButton>
          </>
        );

      case 'paused':
        return (
          <>
            <IconButton onClick={onResume} size="small"><PlayArrowIcon /></IconButton>
            <IconButton onClick={onCancel} size="small"><CloseIcon /></IconButton>
          </>
        );

      case 'completed':
        return (
          <>
            <IconButton onClick={onPlay} size="small"><PlayArrowIcon /></IconButton>
            <IconButton onClick={onShowInFolder} size="small"><FolderOpenIcon /></IconButton>
            <IconButton onClick={onRemove} size="small"><DeleteIcon /></IconButton>
          </>
        );

      case 'error':
        return (
          <>
            <IconButton onClick={onRetry} size="small"><RefreshIcon /></IconButton>
            <IconButton onClick={onRemove} size="small"><DeleteIcon /></IconButton>
          </>
        );

      case 'canceled':
        return <IconButton onClick={onRemove} size="small"><DeleteIcon /></IconButton>;
    }
  };

  return (
    <div className={`queue-item status-${download.status}`}>
      <div className="queue-item-icon">
        {getStatusIcon()}
      </div>

      <div className="queue-item-details">
        <div className="queue-item-filename">
          {download.filename || 'Downloading...'}
        </div>
        <div className="queue-item-url">{download.url}</div>

        {download.status === 'downloading' && (
          <div className="queue-item-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${download.progress}%` }} />
            </div>
            <div className="progress-stats">
              {download.progress}% · {formatSpeed(download.speed)} · {formatETA(download.eta)}
            </div>
          </div>
        )}

        {download.status === 'error' && (
          <div className="queue-item-error">{download.error}</div>
        )}
      </div>

      <div className="queue-item-actions">
        {getActionButtons()}
      </div>
    </div>
  );
}
```

---

### Step 6: Add Queue FAB to FloatingActionButtons

**Update**: `src/renderer/components/FloatingActionButtons.tsx`

**Add Queue Icon with Badge**:
```tsx
import Badge from '@mui/material/Badge';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';

export function FloatingActionButtons({
  hasVideo,
  queueCount = 0,
  onOpenQueue,
  // ... other props
}: FloatingActionButtonsProps) {
  return (
    <>
      {/* ... existing FABs ... */}

      {/* Queue FAB with badge */}
      <Tooltip title="Download Queue" placement="left">
        <Fab
          color="primary"
          size="medium"
          onClick={onOpenQueue}
          className="fab-queue"
        >
          <Badge badgeContent={queueCount} color="error">
            <PlaylistPlayIcon />
          </Badge>
        </Fab>
      </Tooltip>
    </>
  );
}
```

---

### Step 7: Integrate Queue into App.tsx

**Update**: `src/renderer/App.tsx`

**Add Queue State**:
```tsx
const [queueState, setQueueState] = useState<QueueState>({
  downloads: [],
  maxConcurrent: 3,
  activeCount: 0,
});
const [showQueuePanel, setShowQueuePanel] = useState(false);

useEffect(() => {
  // Load initial queue state
  window.electron.queue.getStatus().then(setQueueState);

  // Listen for queue updates
  const cleanup = window.electron.queue.onUpdate((state) => {
    setQueueState(state);
  });

  return cleanup;
}, []);
```

**Add Queue Handlers**:
```tsx
const handleQueueDownload = async (url: string, quality: string, outputPath: string) => {
  await window.electron.queue.addDownload(url, quality, outputPath);
  setShowQueuePanel(true); // Open queue panel to show progress
};

const handlePauseDownload = async (id: string) => {
  await window.electron.queue.pause(id);
};

const handleResumeDownload = async (id: string) => {
  await window.electron.queue.resume(id);
};

const handleCancelDownload = async (id: string) => {
  await window.electron.queue.cancel(id);
};

const handleRetryDownload = async (id: string) => {
  await window.electron.queue.retry(id);
};

const handleRemoveFromQueue = async (id: string) => {
  await window.electron.queue.remove(id);
};

const handleClearCompleted = async () => {
  await window.electron.queue.clearCompleted();
};

const handlePlayDownloadedVideo = async (path: string) => {
  // Load downloaded video into player
  const metadata = await window.electron.video.getMetadata(path);
  setVideoData({
    ...metadata,
    url: `vidmin:${path}`,
  });
  setShowQueuePanel(false);
};

const handleShowInFolder = async (path: string) => {
  await window.electron.showInFolder(path);
};
```

**Update JSX**:
```tsx
return (
  <div className="app">
    {/* ... video player and FABs ... */}

    <FloatingActionButtons
      queueCount={queueState.activeCount + queueState.downloads.filter(d => d.status === 'queued').length}
      onOpenQueue={() => setShowQueuePanel(true)}
      // ... other props
    />

    <DownloadQueuePanel
      isOpen={showQueuePanel}
      onClose={() => setShowQueuePanel(false)}
      queueState={queueState}
      onPause={handlePauseDownload}
      onResume={handleResumeDownload}
      onCancel={handleCancelDownload}
      onRetry={handleRetryDownload}
      onRemove={handleRemoveFromQueue}
      onPlayDownload={handlePlayDownloadedVideo}
      onShowInFolder={handleShowInFolder}
      onClearCompleted={handleClearCompleted}
    />
  </div>
);
```

---

### Step 8: Update DownloadUrlModal

**Update**: `src/renderer/components/DownloadUrlModal.tsx`

**Add "Add to Queue" Option**:
```tsx
interface DownloadUrlModalProps {
  initialUrl?: string;
  onStartDownload: (url: string, quality: string, outputPath: string, addToQueue: boolean) => void;
  onClose: () => void;
}

export function DownloadUrlModal({ initialUrl, onStartDownload, onClose }: DownloadUrlModalProps) {
  // ... existing state ...

  return (
    <div className="download-url-modal">
      {/* ... URL input, quality selector ... */}

      <div className="modal-actions">
        <button onClick={() => onStartDownload(url, quality, outputPath, true)}>
          Add to Queue
        </button>
        <button onClick={() => onStartDownload(url, quality, outputPath, false)}>
          Download Now
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

---

### Step 9: Add Queue Persistence

**Create**: `src/main/queue-store.ts`

**Use electron-store for Persistence**:
```typescript
import Store from 'electron-store';

interface QueueStoreSchema {
  queue: QueuedDownload[];
}

const queueStore = new Store<QueueStoreSchema>({
  name: 'download-queue',
  defaults: {
    queue: [],
  },
});

export function saveQueue(downloads: QueuedDownload[]): void {
  queueStore.set('queue', downloads);
}

export function loadQueue(): QueuedDownload[] {
  return queueStore.get('queue', []);
}

export function clearQueueStore(): void {
  queueStore.clear();
}
```

**Update DownloadManager**:
```typescript
import { saveQueue, loadQueue } from './queue-store';

export class DownloadManager extends EventEmitter {
  constructor() {
    super();
    // ... existing initialization ...

    // Load persisted queue
    this.queue = loadQueue();

    // Resume any incomplete downloads
    this.queue.forEach(download => {
      if (download.status === 'downloading') {
        download.status = 'queued'; // Reset to queued
      }
    });

    // Start processing queue
    this.startNextDownload();
  }

  private updateQueueStore(): void {
    saveQueue(this.queue);
  }

  // Call updateQueueStore() after any queue modification
  queueDownload(...) {
    // ... existing code ...
    this.updateQueueStore();
    return id;
  }

  // ... repeat for other queue methods ...
}
```

---

### Step 10: Add Multi-URL Input Support

**Update**: `src/renderer/components/DownloadUrlModal.tsx`

**Support Multiple URLs**:
```tsx
const [urls, setUrls] = useState<string[]>([initialUrl || '']);

const handleAddUrl = () => {
  setUrls([...urls, '']);
};

const handleRemoveUrl = (index: number) => {
  setUrls(urls.filter((_, i) => i !== index));
};

const handleUrlChange = (index: number, value: string) => {
  const newUrls = [...urls];
  newUrls[index] = value;
  setUrls(newUrls);
};

const handleBatchDownload = () => {
  urls.forEach(url => {
    if (url.trim()) {
      onStartDownload(url, quality, outputPath, true);
    }
  });
  onClose();
};

return (
  <div className="download-url-modal">
    <h2>Download Videos</h2>

    {urls.map((url, index) => (
      <div key={index} className="url-input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(index, e.target.value)}
          placeholder="Enter video URL"
        />
        {urls.length > 1 && (
          <IconButton onClick={() => handleRemoveUrl(index)}>
            <DeleteIcon />
          </IconButton>
        )}
      </div>
    ))}

    <button onClick={handleAddUrl}>+ Add Another URL</button>

    {/* Quality and location selectors */}

    <div className="modal-actions">
      <button onClick={handleBatchDownload}>
        Add {urls.filter(u => u.trim()).length} to Queue
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  </div>
);
```

---

## Testing Strategy

### Unit Tests

1. **DownloadQueuePanel.test.tsx**
   - Renders queue items correctly
   - Batch actions trigger callbacks
   - Empty state displays
   - Opens/closes correctly

2. **DownloadQueueItem.test.tsx**
   - Shows correct status icons
   - Renders appropriate action buttons per status
   - Progress bar updates
   - Error message displays

3. **Queue Integration Tests in App.test.tsx**
   - Add download to queue
   - Pause/resume download
   - Cancel download
   - Retry failed download
   - Remove from queue
   - Clear completed downloads
   - Play downloaded video from queue
   - Multiple concurrent downloads

### Main Process Tests

1. **download-manager.test.ts**
   - Queue download adds to queue
   - Starts next download when slot available
   - Respects max concurrent limit
   - Handles download completion
   - Handles download errors
   - Pause/resume functionality
   - Cancel removes from active
   - Retry requeues download

---

## Acceptance Criteria

### Functionality
- [ ] Multiple downloads can be queued
- [ ] Maximum 3 concurrent downloads enforced
- [ ] Pause/resume works for active downloads
- [ ] Cancel stops download and removes from active
- [ ] Retry requeues failed downloads
- [ ] Completed downloads can be played from queue
- [ ] "Show in Folder" opens file location
- [ ] "Clear Completed" removes all completed
- [ ] Multi-URL input adds all to queue

### UI/UX
- [ ] Queue panel slides in from right
- [ ] Queue FAB shows badge with active count
- [ ] Each queue item shows appropriate status icon
- [ ] Action buttons change based on download status
- [ ] Progress bar updates in real-time
- [ ] Error messages display clearly
- [ ] Empty state shows when no downloads

### Performance
- [ ] Queue handles 20+ downloads smoothly
- [ ] No memory leaks with many completed downloads
- [ ] UI remains responsive during downloads
- [ ] Progress updates throttled (not every packet)

### Persistence
- [ ] Queue persists across app restarts
- [ ] Incomplete downloads resume as queued on restart
- [ ] Completed downloads remain in history

### Edge Cases
- [ ] Duplicate URLs handled gracefully
- [ ] Invalid URLs show error
- [ ] Insufficient disk space detected
- [ ] Network errors trigger retry
- [ ] App close during download saves state

---

## Success Metrics

1. **Concurrency**: 3 simultaneous downloads max
2. **Queue Capacity**: Handles 50+ queued downloads
3. **Performance**: < 100ms UI response time during updates
4. **Persistence**: 100% queue recovery on restart
5. **Reliability**: Failed downloads auto-retry once

---

## Notes

- Queue panel is persistent (doesn't close automatically)
- Badge on Queue FAB shows total of active + queued (not completed)
- Completed downloads remain in queue until manually removed
- Queue order is FIFO (first in, first out)
- Pause doesn't free up slot for next download
- Cancel frees up slot immediately

---

## Next Phase

After completing Phase 7, proceed to Phase 8: Testing, Polish & Production Readiness (formerly Phase 6), which covers:
- Comprehensive E2E testing
- Performance optimization
- Accessibility improvements
- Build and packaging
- Documentation
