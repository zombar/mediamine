# Phase 4: Progressive Playback

## Overview
Implement progressive playback capabilities that allow users to play videos while they're still downloading. This includes MediaSource Extensions (MSE) integration, seeking support during download, and buffer management.

## Dependencies
- Phase 3 must be completed
- MediaSource Extensions API
- Byte range request support

## Goals
- Play video while downloading
- Seek to downloaded portions during download
- Visual buffer indicators showing downloaded vs playing
- Handle network interruptions gracefully
- Memory-efficient buffer management

---

## TDD Test Specifications (Write Tests First)

### Playwright E2E Tests

Key test scenarios:
- Start playing video before download completes
- Seek to downloaded portion during active download
- Seek to un-downloaded portion (should wait or download that segment)
- Display buffer progress indicator
- Handle pause/resume during progressive playback
- Network interruption recovery

### Vitest Unit Tests

Unit test coverage for:
- MSE buffer management logic
- Byte range calculation
- Download chunk coordination
- Buffer state management

---

## Implementation Approach

### MediaSource Extensions Strategy

1. **Dual Stream Architecture**:
   - Download chunks via yt-dlp or HTTP
   - Stream chunks to MSE SourceBuffer for playback
   - Write chunks to disk for permanent storage

2. **Buffer Management**:
   - Track downloaded byte ranges
   - Enable seeking only within downloaded ranges
   - Visual progress bar showing buffered regions

3. **Implementation**:
   ```typescript
   // Create MSE instance
   const mediaSource = new MediaSource();
   const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

   // Feed chunks as downloaded
   downloadChunks.forEach(chunk => {
     sourceBuffer.appendBuffer(chunk);
   });
   ```

---

## Acceptance Criteria

- [ ] Video starts playing while download in progress
- [ ] Seek works within downloaded portions
- [ ] Buffer indicator shows download progress
- [ ] Handles network interruptions
- [ ] All Playwright tests pass
- [ ] All unit tests pass

---

## Next Phase

Once complete, proceed to [Phase 5: Format Conversion](./phase5-conversion.md).
