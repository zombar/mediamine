# Phase 6: UI/UX Redesign - Minimal Floating Interface

## Overview
Complete redesign of the Vidmin user interface with a minimal, video-first approach using floating Material UI controls and unified modal experiences.

## Dependencies
- Phase 5 (Format Conversion) must be completed
- All core functionality working (playback, download, conversion)

## Goals
- Remove all UI chrome (navbar, mode selector, metadata panel)
- Implement floating Material UI icon buttons overlaid on video
- Create unified modal system for downloads and conversions
- Add drag & drop support for files and URLs
- Enable modal minimize/maximize functionality
- Create toggleable metadata overlay

---

## Current UI Issues

1. **Inconsistent UX**: Downloads show inline progress bar, conversions use modal
2. **Screen Space Waste**: Navbar, mode selector, and metadata panel take up space
3. **Can't Watch While Operating**: Download/conversion blocks video viewing
4. **No Drag & Drop**: Users must click buttons to open files or enter URLs

---

## New UI Architecture

### Visual Design Philosophy
- **Video-First**: Full-screen video player with no permanent UI chrome
- **On-Demand Controls**: Floating icons appear on hover/interaction
- **Non-Blocking Operations**: Modals can minimize to pills while video plays
- **Modern Aesthetic**: Material Design with semi-transparent overlays

### Layout Structure
```
┌─────────────────────────────────────┐
│                          ⋮          │ ← Main menu FAB (top-right)
│                                     │
│         Full Video Player           │
│         (no chrome)                 │
│                                     │
│                      ↓ ⟳ ⓘ 📋(3)   │ ← Quick action FABs (bottom-right)
└─────────────────────────────────────┘
     [Progress Modal - Minimized] →  ▭ 45%
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

**Required Packages**:
- `@mui/material` - Material UI components (Fab, IconButton, Tooltip, Menu, etc.)
- `@mui/icons-material` - Material UI icons
- `@emotion/react` - Styling peer dependency
- `@emotion/styled` - Styling peer dependency

---

### Step 2: Strip Down App.tsx

**Remove**:
- Header with title and "Change File" button
- Mode selector buttons (Local File / Download)
- Inline metadata panel below video player
- FileSelector and UrlInput inline components

**Simplify To**:
```tsx
<div className="app" onDrop={handleDrop} onDragOver={handleDragOver}>
  {isDragging && <DragDropOverlay dragType={dragType} />}

  <div className="video-container">
    {videoData ? (
      <VideoPlayer {...videoData} />
    ) : (
      <div className="empty-state">
        Drop a video file or URL here
      </div>
    )}

    <FloatingActionButtons
      hasVideo={!!videoData}
      onOpenFile={handleOpenFile}
      onDownloadUrl={handleDownloadUrl}
      onConvert={handleConvert}
      onToggleMetadata={handleToggleMetadata}
    />

    {showMetadata && <MetadataOverlay metadata={metadata} />}
  </div>

  {showDownloadUrlModal && <DownloadUrlModal ... />}
  {showProgressModal && <ProgressModal ... />}
</div>
```

---

### Step 3: Create FloatingActionButtons Component

**File**: `src/renderer/components/FloatingActionButtons.tsx`

**Icon Mapping**:
- Open File: `FolderOpen` or `VideoFile`
- Download: `CloudDownload` or `GetApp`
- Convert: `Transform` or `ChangeCircle`
- Info: `Info` or `Analytics`
- Menu: `Menu` or `MoreVert`
- Queue: `Queue` or `PlaylistPlay` (with badge showing count)

**Positions**:
- **Top-right (16px from edges)**: Main menu icon
- **Bottom-right (80px from bottom, 16px from right)**: Quick actions when video playing
- **Center**: Large icons when no video loaded

**Features**:
- Tooltips on hover
- Smooth fade-in/out animations
- Conditional rendering based on video state
- Menu component for main menu FAB

**Component Structure**:
```tsx
interface FloatingActionButtonsProps {
  hasVideo: boolean;
  onOpenFile: () => void;
  onDownloadUrl: () => void;
  onConvert?: () => void;
  onToggleMetadata?: () => void;
  downloadQueueCount?: number;
}

export function FloatingActionButtons({
  hasVideo,
  onOpenFile,
  onDownloadUrl,
  onConvert,
  onToggleMetadata,
  downloadQueueCount = 0
}: FloatingActionButtonsProps) {
  // FAB rendering logic with conditional positioning
}
```

---

### Step 4: Implement Drag & Drop System

**Create Component**: `src/renderer/components/DragDropOverlay.tsx`

**Features**:
- Fullscreen overlay during drag operations
- Dashed border (4px, 16px inset from edges)
- Large icon in center (file vs URL detection)
- Animated dashed border rotation
- Text instructions below icon

**Drag Handler Logic in App.tsx**:
```tsx
const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  // Check for files
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    // Get file path from Electron
    const filePath = file.path;
    handleLocalFile(filePath);
  }
  // Check for URL text
  else {
    const text = e.dataTransfer.getData('text/plain');
    if (isValidUrl(text)) {
      setDownloadUrl(text);
      setShowDownloadUrlModal(true);
    }
  }
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();

  // Detect drag type
  const hasFiles = e.dataTransfer.types.includes('Files');
  const hasText = e.dataTransfer.types.includes('text/plain');

  setIsDragging(true);
  setDragType(hasFiles ? 'file' : hasText ? 'url' : null);
};

const handleDragLeave = (e: React.DragEvent) => {
  // Only clear if leaving the entire app div
  if (e.target === e.currentTarget) {
    setIsDragging(false);
    setDragType(null);
  }
};
```

---

### Step 5: Create Unified ProgressModal Component

**File**: `src/renderer/components/ProgressModal.tsx`

**Replaces**: `DownloadProgress.tsx` and `ConversionDialog.tsx`

**Features**:
- Single modal for both download and conversion operations
- Three states: full, minimized, hidden
- Draggable by header
- Mode-specific content rendering

**Props Interface**:
```tsx
interface ProgressModalProps {
  mode: 'download' | 'conversion';
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onCancel: () => void;

  // Download mode props
  downloadProgress?: DownloadProgress;
  onPlayDownloaded?: (path: string) => void;

  // Conversion mode props
  conversionProgress?: number;
  conversionStatus?: 'idle' | 'loading' | 'converting' | 'completed' | 'error';
  conversionError?: string;
  inputFormat?: string;
  inputPath?: string;
  onConvert?: (format: 'mp4' | 'webm', quality: 'high' | 'medium' | 'low') => void;
}
```

**States**:
1. **Full View** (default):
   - Width: 500px, centered
   - Shows all details, format/quality selection, progress
   - Minimize button in header

2. **Minimized View**:
   - Width: 200px, height: 60px
   - Bottom-right corner (16px from edges)
   - Shows compact progress bar and percentage
   - Click to maximize

3. **Hidden**: Stored in state but not rendered

**Styling**:
- Semi-transparent dark background (#2a2a2a)
- Backdrop blur effect
- Smooth slide/scale animations
- Z-index: 2000

---

### Step 6: Create DownloadUrlModal Component

**File**: `src/renderer/components/DownloadUrlModal.tsx`

**Replaces**: `UrlInput.tsx` (but as a modal dialog)

**Features**:
- Modal dialog for entering download URL
- URL validation with error display
- Quality selector (best, 1080p, 720p, 480p, audio only)
- Download location picker
- "Download" and "Cancel" buttons

**Props Interface**:
```tsx
interface DownloadUrlModalProps {
  initialUrl?: string;
  onStartDownload: (url: string, quality: string, outputPath: string) => void;
  onClose: () => void;
}
```

---

### Step 7: Create MetadataOverlay Component

**File**: `src/renderer/components/MetadataOverlay.tsx`

**Replaces**: Inline metadata panel in App.tsx

**Features**:
- Toggleable overlay (controlled by Info FAB)
- Positioned top-left corner (16px from edges)
- Semi-transparent dark background with backdrop blur
- Compact grid layout showing:
  - Filename
  - Duration
  - Resolution
  - Format
  - File size
- Fade in/out animations
- Click outside or Info FAB to dismiss

**Component Structure**:
```tsx
interface MetadataOverlayProps {
  metadata: VideoMetadata;
  onClose: () => void;
}

export function MetadataOverlay({ metadata, onClose }: MetadataOverlayProps) {
  return (
    <div className="metadata-overlay" onClick={onClose}>
      <div className="metadata-content" onClick={(e) => e.stopPropagation()}>
        {/* Metadata grid */}
      </div>
    </div>
  );
}
```

---

### Step 8: Update State Management

**New State Variables in App.tsx**:
```tsx
// Modal visibility
const [showProgressModal, setShowProgressModal] = useState(false);
const [progressModalMode, setProgressModalMode] = useState<'download' | 'conversion'>('download');
const [isProgressModalMinimized, setIsProgressModalMinimized] = useState(false);

// Download URL modal
const [showDownloadUrlModal, setShowDownloadUrlModal] = useState(false);
const [downloadUrl, setDownloadUrl] = useState('');

// Drag & drop
const [isDragging, setIsDragging] = useState(false);
const [dragType, setDragType] = useState<'file' | 'url' | null>(null);

// Metadata overlay
const [showMetadata, setShowMetadata] = useState(false);

// Floating menu
const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
```

**Modal Lifecycle**:
- Download starts → `setShowProgressModal(true)`, `setProgressModalMode('download')`
- User clicks minimize → `setIsProgressModalMinimized(true)`
- User clicks maximize → `setIsProgressModalMinimized(false)`
- Download completes → Option to auto-close or show "Play" button
- Conversion starts → `setProgressModalMode('conversion')`

---

### Step 9: Remove Old Components

**Delete Files**:
- `src/renderer/components/UrlInput.tsx`
- `src/renderer/components/UrlInput.css`
- `src/renderer/components/DownloadProgress.tsx`
- `src/renderer/components/DownloadProgress.css`
- `src/renderer/components/FileSelector.tsx`
- `src/renderer/components/FileSelector.css`
- `src/renderer/components/ConversionDialog.tsx`
- `src/renderer/components/ConversionDialog.css`

**Delete Test Files**:
- `src/renderer/components/__tests__/UrlInput.test.tsx`
- `src/renderer/components/__tests__/DownloadProgress.test.tsx`
- `src/renderer/components/__tests__/FileSelector.test.tsx`

---

### Step 10: Update CSS

**New CSS Files to Create**:
- `FloatingActionButtons.css`
- `ProgressModal.css`
- `DownloadUrlModal.css`
- `MetadataOverlay.css`
- `DragDropOverlay.css`

**Update App.css**:
```css
.app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.5rem;
}
```

**Key CSS Patterns**:
- Semi-transparent backgrounds: `background: rgba(0, 0, 0, 0.8)`
- Backdrop blur: `backdrop-filter: blur(10px)`
- Smooth animations: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Material elevation: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)`

---

## Testing Strategy

### New Test Files to Create

1. **FloatingActionButtons.test.tsx**
   - Renders correct icons based on video state
   - Click handlers fire correctly
   - Menu opens and closes
   - Tooltips appear
   - Conditional positioning works

2. **ProgressModal.test.tsx**
   - Renders in download mode with correct content
   - Renders in conversion mode with correct content
   - Minimize/maximize functionality
   - Progress updates correctly
   - Error states display
   - Cancel button works

3. **DownloadUrlModal.test.tsx**
   - URL validation works
   - Quality selector changes state
   - Download button triggers callback
   - Cancel closes modal
   - Initial URL pre-fills field

4. **MetadataOverlay.test.tsx**
   - Displays all metadata fields
   - Close button works
   - Click outside closes overlay
   - Animations work correctly

5. **DragDropOverlay.test.tsx**
   - Shows correct icon for file vs URL
   - Displays appropriate text
   - Animates border correctly
   - Disappears on drag leave

### Integration Tests in App.test.tsx

- Drag & drop file triggers playback
- Drag & drop URL opens download modal
- Download flow: URL → modal → progress modal → play
- Conversion flow: incompatible file → conversion modal → converted → play
- Modal minimize: download continues, video plays
- Multiple operations: download + watch different video

---

## Acceptance Criteria

### Visual Design
- [ ] No permanent UI chrome visible
- [ ] Full-screen video player
- [ ] Floating icons appear on appropriate triggers
- [ ] Icons have smooth hover animations
- [ ] Tooltips provide context
- [ ] Material Design aesthetic throughout

### Functionality
- [ ] All features accessible via FABs
- [ ] Drag & drop works for files and URLs
- [ ] Modals can minimize to pills
- [ ] Video continues playing with minimized modal
- [ ] Metadata overlay toggles on/off
- [ ] Main menu provides access to settings

### User Experience
- [ ] Intuitive icon placement
- [ ] Clear visual feedback for all actions
- [ ] Smooth transitions and animations
- [ ] No blocking operations
- [ ] Error states clearly communicated

### Accessibility
- [ ] All FABs keyboard accessible
- [ ] ARIA labels on all interactive elements
- [ ] Focus indicators visible
- [ ] Tooltips accessible via keyboard
- [ ] Modals trap focus appropriately

### Testing
- [ ] All new components have unit tests
- [ ] Integration tests cover main workflows
- [ ] Drag & drop thoroughly tested
- [ ] Modal state management tested
- [ ] No regressions in existing functionality

---

## Success Metrics

1. **Screen Space**: 100% dedicated to video (vs ~70% before)
2. **Click Reduction**: 1 click to access most features (vs 2-3)
3. **Modern Feel**: Material Design aesthetic throughout
4. **Non-Blocking**: Operations don't interrupt viewing
5. **Discoverability**: Tooltips and icons make features discoverable

---

## Notes

- Phase 6 sets the foundation for Phase 7 (Download Queue)
- Queue panel will integrate with FAB system
- All modal patterns established here extend to future features
- Drag & drop architecture supports future enhancements (playlist drops, etc.)

---

## Next Phase

After completing Phase 6, proceed to Phase 7: Download Queue Management, which will add:
- Multiple concurrent downloads
- Queue management UI
- Per-download controls (pause, resume, cancel)
- Queue FAB with badge
