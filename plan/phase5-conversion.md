# Phase 5: Format Conversion

## Overview
Integrate ffmpeg.wasm for client-side video format conversion, allowing users to convert downloaded videos to different formats without requiring server-side processing.

## Dependencies
- Phase 3 must be completed
- @ffmpeg/ffmpeg package
- @ffmpeg/util package

## Goals
- Detect video format compatibility
- Convert videos to MP4/WebM for universal playback
- Progress tracking during conversion
- Quality/codec selection
- Background conversion processing

---

## TDD Test Specifications (Write Tests First)

### Playwright E2E Tests

Key test scenarios:
- Detect incompatible video format (FLV, WMV, etc.)
- Offer conversion option to user
- Start conversion with progress tracking
- Convert video successfully
- Play converted video
- Cancel conversion mid-process
- Multiple concurrent conversions

### Vitest Unit Tests

Unit test coverage for:
- Format detection logic
- Codec compatibility checking
- Conversion parameter generation
- Progress parsing from ffmpeg output

---

## Implementation Approach

### ffmpeg.wasm Integration

1. **Format Detection**:
   ```typescript
   function needsConversion(format: string): boolean {
     const unsupportedFormats = ['flv', 'wmv', 'avi', 'mkv'];
     return unsupportedFormats.includes(format.toLowerCase());
   }
   ```

2. **Conversion Setup**:
   ```typescript
   import { FFmpeg } from '@ffmpeg/ffmpeg';
   import { fetchFile } from '@ffmpeg/util';

   const ffmpeg = new FFmpeg();
   await ffmpeg.load();

   // Convert to MP4
   await ffmpeg.writeFile('input.flv', await fetchFile(inputPath));
   await ffmpeg.exec(['-i', 'input.flv', '-c:v', 'libx264', '-c:a', 'aac', 'output.mp4']);
   const data = await ffmpeg.readFile('output.mp4');
   ```

3. **Progress Tracking**:
   ```typescript
   ffmpeg.on('progress', ({ progress }) => {
     console.log(`Conversion: ${progress * 100}%`);
   });
   ```

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

### Step 2: Create Conversion Manager
- Detect format compatibility
- Initialize ffmpeg.wasm worker
- Handle conversion queue
- Track progress and errors

### Step 3: UI Components
- Format detection indicator
- Conversion options dialog
- Progress bar during conversion
- Conversion queue list

### Step 4: Integration
- Auto-detect after download
- Offer conversion if needed
- Allow manual conversion requests
- Update video player after conversion

---

## Acceptance Criteria

- [ ] Detects incompatible formats automatically
- [ ] Offers conversion with quality options
- [ ] Shows real-time conversion progress
- [ ] Successfully converts FLV/WMV/AVI to MP4
- [ ] Converted videos play correctly
- [ ] Can cancel conversion in progress
- [ ] All Playwright tests pass
- [ ] All unit tests pass

---

## Success Metrics

1. **Conversion accuracy**: 100% success rate for supported formats
2. **Performance**: Conversion speed acceptable (1x realtime or better)
3. **Quality**: Output quality matches selected preset
4. **Stability**: No crashes during long conversions

---

## Next Phase

Once complete, proceed to [Phase 6: Testing & Polish](./phase6-polish.md).
