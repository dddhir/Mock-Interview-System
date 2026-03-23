# Voice Recording Module Implementation Guide

## Overview

The voice recording module has been implemented with the following components:

### Frontend Components
- **VoiceRecorder.jsx** - React component for audio capture and UI management
- **Interview.jsx** - Updated to integrate VoiceRecorder component

### Backend Services
- **transcriptionService.js** - Audio validation and Speech-to-Text integration
- **transcriptionRoutes.js** - API endpoint for transcription requests

### Tests
- **VoiceRecorder.test.jsx** - Component tests with property-based testing
- **transcriptionService.test.js** - Service tests for audio validation

## Implementation Status

### Completed Tasks

#### 1. Frontend Component (VoiceRecorder.jsx)
✅ **Features Implemented:**
- Microphone access request with permission handling
- Real-time duration counter (MM:SS format)
- Recording state management (idle, recording, stopped, transcribing, completed, error)
- Audio blob capture and preservation
- Automatic stop at 5 minutes
- Minimum duration validation (1 second)
- Error handling with user-friendly messages
- Re-recording functionality
- ARIA attributes for accessibility
- Visual feedback with status indicators

**State Management:**
```javascript
- status: 'idle' | 'recording' | 'stopped' | 'transcribing' | 'completed' | 'error'
- duration: number (seconds)
- audioBlob: Blob | null
- transcribedText: string
- errorMessage: string
- isTranscribing: boolean
```

**Key Methods:**
- `startRecording()` - Initialize microphone and begin capture
- `stopRecording()` - Stop capture and finalize audio blob
- `transcribeAudio()` - Send audio to backend for transcription
- `resetRecorder()` - Clear state and prepare for new recording

#### 2. Backend Transcription Service (transcriptionService.js)
✅ **Features Implemented:**
- Audio format validation (WAV, WebM, MP3)
- File size validation (max 25MB)
- Duration validation (1 second to 5 minutes)
- Google Cloud Speech-to-Text integration
- Error handling with specific error codes
- Confidence score calculation

**Validation Functions:**
- `validateAudio(file)` - Validates format and size
- `transcribeAudio(audioBuffer, format)` - Transcribes audio using Google Cloud API
- `getAudioEncoding(format)` - Maps format to API encoding

**Error Codes:**
- `INVALID_AUDIO_FORMAT` - Unsupported audio format
- `AUDIO_TOO_LARGE` - File exceeds 25MB limit
- `AUDIO_TOO_SHORT` - Duration less than 1 second
- `TRANSCRIPTION_FAILED` - API transcription error
- `SERVICE_UNAVAILABLE` - API temporarily unavailable
- `TRANSCRIPTION_TIMEOUT` - Transcription took too long

#### 3. Backend API Endpoint (transcriptionRoutes.js)
✅ **Features Implemented:**
- POST `/api/interview/transcribe` endpoint
- Multer file upload handling
- Audio validation
- Authentication middleware
- Error response formatting
- Transcription result return

**Request Format:**
```javascript
POST /api/interview/transcribe
Content-Type: multipart/form-data

{
  audio: File,
  format?: string
}
```

**Response Format:**
```javascript
{
  success: true,
  transcription: string,
  confidence: number,
  duration: number
}
```

#### 4. Interview Component Integration
✅ **Features Implemented:**
- VoiceRecorder component imported and added
- Positioned above Answer_Textarea
- Callback handlers for transcription completion
- Error handling with toast notifications
- Disabled state during submission

#### 5. Dependencies Updated
✅ **Added to package.json:**
- `@google-cloud/speech` - Google Cloud Speech-to-Text API client

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Client dependencies
cd client && npm install
```

### 2. Configure Google Cloud Speech-to-Text

1. Create a Google Cloud project
2. Enable the Speech-to-Text API
3. Create a service account and download the JSON key
4. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

### 3. Environment Variables

Add to `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 4. Start the Application

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

## Property-Based Testing

The implementation includes property-based tests that validate correctness properties:

### Property 1: Recording Duration Accuracy
- **Test:** Duration counter matches actual recording within ±1 second
- **Validates:** Requirements 1.5
- **Location:** VoiceRecorder.test.jsx

### Property 2: Microphone Permission Caching
- **Test:** Permission prompt doesn't appear on subsequent attempts
- **Validates:** Requirements 8.2
- **Location:** VoiceRecorder.test.jsx

### Property 3: Audio Data Preservation on Transcription Error
- **Test:** Audio blob remains intact after transcription failure
- **Validates:** Requirements 4.5
- **Location:** VoiceRecorder.test.jsx

### Property 4: Recording State Machine Validity
- **Test:** State transitions follow valid sequences
- **Validates:** Requirements 2.2, 6.2, 6.3, 6.4, 6.5
- **Location:** VoiceRecorder.test.jsx

### Property 5: Textarea Population Completeness
- **Test:** Textarea populated with complete transcribed text atomically
- **Validates:** Requirements 3.4, 5.1
- **Location:** VoiceRecorder.test.jsx

### Property 6: Re-recording State Reset
- **Test:** Previous data completely cleared on re-record
- **Validates:** Requirements 7.2, 7.3, 7.4
- **Location:** VoiceRecorder.test.jsx

### Property 7: Audio Format Validation
- **Test:** Only WAV, WebM, MP3 formats accepted
- **Validates:** Requirements 10.2
- **Location:** transcriptionService.test.js

### Property 8: Minimum Audio Duration Enforcement
- **Test:** Recordings < 1 second rejected with warning
- **Validates:** Requirements 9.3
- **Location:** VoiceRecorder.test.jsx, transcriptionService.test.js

### Property 9: Maximum Recording Duration Enforcement
- **Test:** Recordings > 5 minutes automatically stopped
- **Validates:** Requirements 2.4, 9.4
- **Location:** VoiceRecorder.test.jsx, transcriptionService.test.js

### Property 13: Accessibility Attributes Presence
- **Test:** ARIA attributes present on all interactive elements
- **Validates:** Requirements 12.1, 12.2
- **Location:** VoiceRecorder.test.jsx

### Property 14: Error Message Clarity
- **Test:** Error messages are user-friendly without technical jargon
- **Validates:** Requirements 12.3
- **Location:** VoiceRecorder.test.jsx

## Running Tests

```bash
# Frontend tests
cd client && npm run test

# Backend tests
npm run test

# Run specific test file
npm run test -- transcriptionService.test.js
```

## Browser Compatibility

The voice recording feature requires:
- **Chrome/Chromium** 25+
- **Firefox** 25+
- **Safari** 14.1+
- **Edge** 79+

Older browsers will see a compatibility message and the voice recording UI will be hidden.

## Audio Quality Specifications

- **Sample Rate:** 16kHz (16000 Hz)
- **Channels:** Mono (1 channel)
- **Format:** WebM (Opus codec)
- **Maximum Duration:** 5 minutes (300 seconds)
- **Minimum Duration:** 1 second
- **Maximum File Size:** 25MB

## Error Handling

### Microphone Access Errors
- **NotAllowedError:** User denied microphone access
  - Message: "Microphone access denied. Please enable microphone access in your browser settings."
- **NotFoundError:** No microphone device found
  - Message: "No microphone found. Please connect a microphone and try again."

### Recording Errors
- **Duration < 1 second:** Warning displayed, transcription prevented
- **Duration > 5 minutes:** Recording automatically stopped with notification

### Transcription Errors
- **Invalid format:** User-friendly error with retry option
- **File too large:** Error message with suggestion to record shorter answer
- **Service unavailable:** Suggestion to retry later
- **Network error:** Retry button enabled

## Integration with Existing Interview Flow

The VoiceRecorder component integrates seamlessly with the existing interview system:

1. **Answer Submission:** Transcribed text is treated identically to typed text
2. **Scoring:** Same evaluation and scoring logic applies
3. **Feedback:** Same feedback system displays for transcribed answers
4. **Navigation:** Recording is automatically stopped when navigating away
5. **Session Management:** Works with existing session tracking

## Accessibility Features

- **ARIA Labels:** All buttons have descriptive aria-label attributes
- **ARIA Pressed:** Toggle buttons have aria-pressed state
- **ARIA Live:** Status changes announced to screen readers
- **Keyboard Navigation:** All controls accessible via keyboard
- **Visual Indicators:** Color-coded status with animations
- **Error Messages:** Clear, readable error text without technical jargon

## Performance Considerations

- **Audio Compression:** WebM format reduces file size
- **Mono Recording:** Single channel reduces bandwidth
- **Memory Management:** Audio context and streams properly cleaned up
- **Timeout Handling:** 30-second timeout on transcription requests
- **Resource Cleanup:** Automatic cleanup on component unmount

## Future Enhancements

Potential improvements for future versions:

1. **Multiple Language Support:** Add language selection dropdown
2. **Real-time Transcription:** Stream audio for live transcription
3. **Audio Playback:** Allow users to review recorded audio before transcription
4. **Confidence Threshold:** Warn users if confidence score is low
5. **Retry Logic:** Automatic retry with exponential backoff
6. **Analytics:** Track voice recording usage and success rates
7. **Offline Support:** Cache transcriptions for offline use
8. **Custom Vocabulary:** Support domain-specific vocabulary

## Troubleshooting

### Microphone Not Working
1. Check browser permissions in settings
2. Verify microphone is connected and working
3. Try a different browser
4. Restart the browser

### Transcription Failing
1. Check internet connection
2. Verify Google Cloud credentials are set
3. Check audio file size (max 25MB)
4. Verify audio duration (1 second to 5 minutes)

### Audio Quality Issues
1. Ensure quiet environment
2. Speak clearly and at normal volume
3. Check microphone is not muted
4. Try recording in a different location

## Support

For issues or questions:
1. Check the error message displayed in the UI
2. Review browser console for detailed error logs
3. Verify Google Cloud Speech-to-Text API is enabled
4. Check network connectivity
5. Ensure all dependencies are installed

## References

- [Google Cloud Speech-to-Text API](https://cloud.google.com/speech-to-text/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
