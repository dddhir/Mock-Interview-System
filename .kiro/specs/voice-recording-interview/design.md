# Design Document: Voice Recording for Interview System

## Overview

This design document specifies the technical implementation of voice recording and speech-to-text transcription for the interview system. The feature integrates a client-side audio capture component with a backend transcription service, enabling users to answer interview questions verbally with automatic text conversion.

The architecture follows a modular approach with clear separation between:
- **Frontend**: Audio capture, UI state management, and user interaction
- **Backend**: Audio validation, transcription service integration, and error handling
- **External Service**: Speech-to-text API (Google Cloud Speech-to-Text or Web Speech API)

## Architecture

### High-Level Flow

```
User clicks Record
    ↓
Browser requests microphone permission
    ↓
Audio captured via Web Audio API
    ↓
User clicks Stop
    ↓
Audio converted to WAV/WebM format
    ↓
User clicks Transcribe
    ↓
Frontend sends audio to /api/interview/transcribe
    ↓
Backend validates audio and sends to Speech-to-Text service
    ↓
Transcription returned to frontend
    ↓
Answer textarea populated with transcribed text
    ↓
User edits (optional) and submits answer
    ↓
Answer processed through existing interview flow
```

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Interview Page                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  VoiceRecorder       │      │  Answer Textarea     │    │
│  │  Component           │      │  (Existing)          │    │
│  │                      │      │                      │    │
│  │ - Record button      │      │ - Editable text      │    │
│  │ - Stop button        │      │ - Submit button      │    │
│  │ - Transcribe button  │      │ - Skip button        │    │
│  │ - Status display     │      │                      │    │
│  │ - Duration counter   │      │                      │    │
│  └──────────────────────┘      └──────────────────────┘    │
│           │                              ▲                  │
│           │ (populates)                  │                  │
│           └──────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ (sends audio)
                           ▼
        ┌──────────────────────────────────┐
        │  Backend API                     │
        │  POST /api/interview/transcribe  │
        ├──────────────────────────────────┤
        │ - Validate audio format/size     │
        │ - Call Speech-to-Text service    │
        │ - Return transcription           │
        └──────────────────────────────────┘
                           │
                           │ (sends audio)
                           ▼
        ┌──────────────────────────────────┐
        │  Speech-to-Text Service          │
        │  (Google Cloud Speech-to-Text)   │
        ├──────────────────────────────────┤
        │ - Transcribe audio               │
        │ - Return text + confidence       │
        └──────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. VoiceRecorder Component

**Location**: `client/src/components/VoiceRecorder.jsx`

**Props**:
```typescript
interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}
```

**State Management**:
```typescript
interface RecorderState {
  status: 'idle' | 'recording' | 'stopped' | 'transcribing' | 'completed' | 'error';
  duration: number;           // in seconds
  audioBlob: Blob | null;
  transcribedText: string;
  errorMessage: string;
  isTranscribing: boolean;
  recordingStartTime: number;
}
```

**Key Methods**:
- `startRecording()`: Initialize microphone access and begin audio capture
- `stopRecording()`: Stop audio capture and finalize audio blob
- `transcribeAudio()`: Send audio to backend for transcription
- `resetRecorder()`: Clear state and prepare for new recording
- `handleError(error)`: Display error messages and manage error state

**UI Elements**:
- Record button (enabled when status is 'idle')
- Stop button (enabled when status is 'recording')
- Transcribe button (enabled when status is 'stopped')
- Re-record button (enabled when status is 'completed' or 'error')
- Status display (shows current status with icon)
- Duration counter (displays MM:SS format during recording)
- Error message display (shows error details when status is 'error')
- Loading indicator (shown during transcription)

#### 2. Integration with Interview Component

**Modifications to Interview.jsx**:
- Import VoiceRecorder component
- Add VoiceRecorder component above Answer_Textarea
- Pass `onTranscriptionComplete` callback to populate textarea
- Pass `onError` callback to display error toasts
- Disable VoiceRecorder when submitting answer

### Backend API Endpoint

#### POST /api/interview/transcribe

**Request**:
```typescript
{
  audio: File,           // Audio file (WAV, WebM, or MP3)
  sessionId: string,     // Interview session ID
  format?: string        // Audio format (default: 'wav')
}
```

**Response (Success)**:
```typescript
{
  success: true,
  transcription: string,
  confidence: number,    // 0-1 confidence score
  duration: number       // audio duration in seconds
}
```

**Response (Error)**:
```typescript
{
  success: false,
  error: string,
  code: string           // Error code for client-side handling
}
```

**Error Codes**:
- `INVALID_AUDIO_FORMAT`: Audio format not supported
- `AUDIO_TOO_LARGE`: Audio file exceeds size limit (e.g., 25MB)
- `AUDIO_TOO_SHORT`: Audio duration less than 1 second
- `TRANSCRIPTION_FAILED`: Speech-to-Text service error
- `SERVICE_UNAVAILABLE`: Speech-to-Text service temporarily unavailable
- `INVALID_SESSION`: Session ID not found or invalid

## Data Models

### Audio Blob Structure

```typescript
interface AudioData {
  blob: Blob;
  format: 'wav' | 'webm' | 'mp3';
  duration: number;           // in seconds
  sampleRate: number;         // e.g., 16000 Hz
  channels: number;           // 1 for mono
  timestamp: number;          // when recording started
}
```

### Transcription Response

```typescript
interface TranscriptionResult {
  text: string;
  confidence: number;         // 0-1 scale
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  duration: number;           // audio duration in seconds
}
```

### Recording Session

```typescript
interface RecordingSession {
  sessionId: string;
  audioBlob: Blob;
  transcription: TranscriptionResult | null;
  status: 'recording' | 'stopped' | 'transcribing' | 'completed' | 'error';
  startTime: number;
  endTime: number;
  errorMessage?: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Recording Duration Accuracy

**For any** recording session, the displayed duration counter should match the actual audio duration within ±1 second throughout the recording.

**Validates: Requirements 1.5**

### Property 2: Microphone Permission Caching

**For any** browser session, if microphone permissions are granted once, subsequent recording attempts should not trigger a permission prompt.

**Validates: Requirements 8.2**

### Property 3: Audio Data Preservation on Transcription Error

**For any** failed transcription attempt, the audio blob should remain intact and available for retry without requiring re-recording.

**Validates: Requirements 4.5**

### Property 4: Recording State Machine Validity

**For any** recording session, state transitions should only follow valid sequences: idle → recording → stopped → transcribing → completed, with error reachable from any state.

**Validates: Requirements 2.2, 6.2, 6.3, 6.4, 6.5**

### Property 5: Textarea Population Completeness

**For any** successful transcription, the Answer_Textarea should be populated with the complete transcribed text atomically, with no partial or corrupted content.

**Validates: Requirements 3.4, 5.1**

### Property 6: Re-recording State Reset

**For any** re-recording action, the previous audio data and transcription should be completely cleared, and the recorder should return to idle state.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 7: Audio Format Validation

**For any** audio file sent to the backend, the backend should validate the format and reject files that are not WAV, WebM, or MP3 with appropriate error codes.

**Validates: Requirements 10.2**

### Property 8: Minimum Audio Duration Enforcement

**For any** recording session with duration less than 1 second, the system should display a warning and prevent transcription from proceeding.

**Validates: Requirements 9.3**

### Property 9: Maximum Recording Duration Enforcement

**For any** recording session, if the duration exceeds 5 minutes, the system should automatically stop recording and display a notification.

**Validates: Requirements 2.4, 9.4**

### Property 10: Answer Submission Equivalence

**For any** answer submitted (whether typed or transcribed), the backend should process it identically through the existing submission flow without distinguishing origin.

**Validates: Requirements 5.4, 11.2**

### Property 11: Microphone Permission Denial Handling

**For any** microphone access denial, the system should display a clear error message and provide browser-specific instructions for enabling access.

**Validates: Requirements 1.4**

### Property 12: Recording Cleanup on Navigation

**For any** active recording when the user navigates away from the interview page, the recording should be automatically stopped and resources cleaned up.

**Validates: Requirements 11.3**

### Property 13: Accessibility Attributes Presence

**For any** voice recording button or control, the rendered element should include appropriate ARIA attributes (aria-label, aria-pressed, aria-live) for screen reader compatibility.

**Validates: Requirements 12.1, 12.2**

### Property 14: Error Message Clarity

**For any** error condition, the displayed error message should be user-friendly and not contain technical jargon or error codes visible to the user.

**Validates: Requirements 12.3**

## Error Handling

### Microphone Access Errors

**Scenario**: User denies microphone permission

**Handling**:
1. Catch `NotAllowedError` from `getUserMedia()`
2. Display error message: "Microphone access denied. Please enable microphone access in your browser settings to use voice recording."
3. Provide link to browser-specific instructions
4. Disable record button

**Scenario**: Browser doesn't support Web Audio API

**Handling**:
1. Detect browser capability on component mount
2. Display compatibility message: "Your browser doesn't support voice recording. Please use a modern browser (Chrome, Firefox, Safari, Edge)."
3. Hide voice recording UI

### Audio Recording Errors

**Scenario**: Recording exceeds 5 minutes

**Handling**:
1. Monitor recording duration in real-time
2. Automatically call `stopRecording()` when duration reaches 5 minutes
3. Display notification: "Recording stopped. Maximum duration is 5 minutes."
4. Enable transcribe button

**Scenario**: Audio is too short (< 1 second)

**Handling**:
1. Check audio duration after stopping
2. Display warning: "Recording is too short. Please record at least 1 second of audio."
3. Enable re-record button

### Transcription Errors

**Scenario**: Transcription API returns error

**Handling**:
1. Catch error from `/api/interview/transcribe`
2. Map error code to user-friendly message
3. Display error message with retry option
4. Preserve audio blob for retry

**Scenario**: Transcription timeout (> 30 seconds)

**Handling**:
1. Set 30-second timeout on transcription request
2. Display warning: "Transcription is taking longer than expected. Please wait or try again."
3. Allow user to cancel and retry

**Scenario**: Network error during transcription

**Handling**:
1. Catch network error
2. Display message: "Network error. Please check your connection and try again."
3. Enable retry button

### Audio Format Errors

**Scenario**: Audio format not supported

**Handling**:
1. Backend validates audio format
2. Return error: `INVALID_AUDIO_FORMAT`
3. Frontend displays: "Audio format not supported. Please try recording again."
4. Enable re-record button

**Scenario**: Audio file too large

**Handling**:
1. Backend checks file size (limit: 25MB)
2. Return error: `AUDIO_TOO_LARGE`
3. Frontend displays: "Audio file is too large. Please record a shorter answer."
4. Enable re-record button

## Testing Strategy

### Unit Testing

**VoiceRecorder Component Tests**:
- Test microphone permission request flow
- Test recording start/stop state transitions
- Test duration counter accuracy
- Test error message display
- Test re-record functionality
- Test textarea population after transcription
- Test button enable/disable logic based on state

**Backend Endpoint Tests**:
- Test audio format validation
- Test audio size validation
- Test successful transcription flow
- Test error responses for various failure scenarios
- Test session ID validation

### Property-Based Testing

**Property 1: Recording Duration Accuracy**
- **Feature: voice-recording-interview, Property 1: Recording Duration Accuracy**
- Generate random recording durations (1-300 seconds)
- Verify displayed duration matches actual duration within ±1 second
- Minimum 100 iterations

**Property 2: Microphone Permission Caching**
- **Feature: voice-recording-interview, Property 2: Microphone Permission Caching**
- Simulate permission grant scenarios
- Verify permission state is cached and no prompt appears on subsequent attempts
- Minimum 100 iterations

**Property 3: Audio Data Preservation on Transcription Error**
- **Feature: voice-recording-interview, Property 3: Audio Data Preservation on Transcription Error**
- Generate random audio blobs
- Simulate transcription failures
- Verify audio blob remains intact for retry
- Minimum 100 iterations

**Property 4: Recording State Machine Validity**
- **Feature: voice-recording-interview, Property 4: Recording State Machine Validity**
- Generate random sequences of recording actions
- Verify state transitions follow valid sequence
- Verify invalid transitions are rejected
- Minimum 100 iterations

**Property 5: Textarea Population Completeness**
- **Feature: voice-recording-interview, Property 5: Textarea Population Completeness**
- Generate random transcription results
- Verify textarea is populated completely and atomically
- Verify no partial or corrupted text appears
- Minimum 100 iterations

**Property 6: Re-recording State Reset**
- **Feature: voice-recording-interview, Property 6: Re-recording State Reset**
- Generate random recording sessions
- Perform re-record action
- Verify previous data is cleared and state is reset
- Minimum 100 iterations

**Property 7: Audio Format Validation**
- **Feature: voice-recording-interview, Property 7: Audio Format Validation**
- Generate random audio files with various formats
- Send to backend
- Verify only valid formats (WAV, WebM, MP3) are accepted
- Minimum 100 iterations

**Property 8: Minimum Audio Duration Enforcement**
- **Feature: voice-recording-interview, Property 8: Minimum Audio Duration Enforcement**
- Generate audio recordings with durations 0-2 seconds
- Verify recordings < 1 second are rejected with warning
- Minimum 100 iterations

**Property 9: Maximum Recording Duration Enforcement**
- **Feature: voice-recording-interview, Property 9: Maximum Recording Duration Enforcement**
- Generate recording sessions with durations 0-10 minutes
- Verify recordings > 5 minutes are automatically stopped
- Minimum 100 iterations

**Property 10: Answer Submission Equivalence**
- **Feature: voice-recording-interview, Property 10: Answer Submission Equivalence**
- Generate random answers (typed and transcribed)
- Submit both types
- Verify backend processes them identically
- Minimum 100 iterations

**Property 11: Microphone Permission Denial Handling**
- **Feature: voice-recording-interview, Property 11: Microphone Permission Denial Handling**
- Simulate microphone access denial
- Verify error message is displayed
- Verify instructions are provided
- Minimum 100 iterations

**Property 12: Recording Cleanup on Navigation**
- **Feature: voice-recording-interview, Property 12: Recording Cleanup on Navigation**
- Simulate active recording during navigation
- Verify recording is stopped and resources cleaned up
- Minimum 100 iterations

**Property 13: Accessibility Attributes Presence**
- **Feature: voice-recording-interview, Property 13: Accessibility Attributes Presence**
- Generate random voice recording controls
- Verify ARIA attributes are present on all interactive elements
- Minimum 100 iterations

**Property 14: Error Message Clarity**
- **Feature: voice-recording-interview, Property 14: Error Message Clarity**
- Generate random error conditions
- Verify error messages are user-friendly and clear
- Minimum 100 iterations

### Integration Testing

**End-to-End Voice Recording Flow**:
1. User clicks record button
2. Microphone permission granted
3. User speaks for 10 seconds
4. User clicks stop
5. User clicks transcribe
6. Transcription completes
7. Textarea populated with transcribed text
8. User edits text
9. User submits answer
10. Answer processed through existing interview flow

**Error Recovery Flow**:
1. User clicks record button
2. Microphone permission denied
3. Error message displayed
4. User enables microphone in settings
5. User clicks record button again
6. Recording succeeds

**Re-recording Flow**:
1. User records and transcribes
2. User clicks re-record
3. Previous audio and transcription cleared
4. New recording starts
5. New transcription completes

