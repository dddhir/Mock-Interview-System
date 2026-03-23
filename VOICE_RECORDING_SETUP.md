# Voice Recording Setup Guide

## Quick Start

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
```

### Step 2: Set Up Google Cloud Speech-to-Text

#### Option A: Using Service Account (Recommended for Production)

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a Project" → "New Project"
   - Enter project name and click "Create"

2. **Enable Speech-to-Text API**
   - In the Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Speech-to-Text"
   - Click on "Cloud Speech-to-Text API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip optional steps and click "Done"

4. **Create and Download Key**
   - In the service account list, click on the newly created account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create"
   - The JSON file will download automatically

5. **Set Environment Variable**
   ```bash
   # On Windows (Command Prompt)
   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json

   # On Windows (PowerShell)
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"

   # On macOS/Linux
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

6. **Add to .env file (Optional)**
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```

#### Option B: Using Application Default Credentials (Development)

1. **Install Google Cloud CLI**
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Windows (using Chocolatey)
   choco install google-cloud-sdk

   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

2. **Authenticate**
   ```bash
   gcloud auth application-default login
   ```

3. **Select Project**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

### Step 3: Verify Setup

Test the transcription endpoint:

```bash
# Start the backend server
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:5001/api/interview/transcribe \
  -F "audio=@test-audio.wav" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Run the Application

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

Visit `http://localhost:5173` in your browser.

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Server
PORT=5001
NODE_ENV=development

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/ai-mock-interview

# JWT
JWT_SECRET=your_jwt_secret_key
```

### Audio Settings

The VoiceRecorder component uses these default settings:

```javascript
{
  audio: {
    sampleRate: 16000,      // 16kHz
    channelCount: 1,        // Mono
    echoCancellation: true,
    noiseSuppression: true,
  }
}
```

To modify these settings, edit `client/src/components/VoiceRecorder.jsx`:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,      // Change sample rate
    channelCount: 1,        // Change to 2 for stereo
    echoCancellation: true, // Toggle echo cancellation
    noiseSuppression: true, // Toggle noise suppression
  },
});
```

### Transcription Settings

To modify transcription settings, edit `services/transcriptionService.js`:

```javascript
const request = {
  audio: {
    content: audioBuffer.toString('base64'),
  },
  config: {
    encoding: encoding,
    sampleRateHertz: 16000,        // Change sample rate
    languageCode: 'en-US',         // Change language
    enableAutomaticPunctuation: true,
    model: 'latest_long',          // Change model
  },
};
```

## Supported Languages

The Speech-to-Text API supports many languages. To change the language, modify the `languageCode` in `transcriptionService.js`:

```javascript
// Examples:
languageCode: 'en-US',  // English (US)
languageCode: 'en-GB',  // English (UK)
languageCode: 'es-ES',  // Spanish
languageCode: 'fr-FR',  // French
languageCode: 'de-DE',  // German
languageCode: 'ja-JP',  // Japanese
languageCode: 'zh-CN',  // Chinese (Simplified)
```

See [Supported Languages](https://cloud.google.com/speech-to-text/docs/languages) for the complete list.

## Testing

### Manual Testing

1. **Test Microphone Access**
   - Click "Record" button
   - Grant microphone permission when prompted
   - Verify recording starts

2. **Test Recording**
   - Speak for 5-10 seconds
   - Click "Stop"
   - Verify duration is displayed correctly

3. **Test Transcription**
   - Click "Transcribe"
   - Wait for transcription to complete
   - Verify text appears in textarea

4. **Test Error Handling**
   - Try recording for less than 1 second
   - Try recording for more than 5 minutes
   - Deny microphone permission
   - Disconnect internet during transcription

### Automated Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- VoiceRecorder.test.jsx

# Run with coverage
npm run test -- --coverage
```

## Troubleshooting

### "GOOGLE_APPLICATION_CREDENTIALS not found"

**Solution:**
1. Verify the path to the service account JSON file is correct
2. Check that the file exists and is readable
3. Ensure the environment variable is set correctly:
   ```bash
   # Verify on macOS/Linux
   echo $GOOGLE_APPLICATION_CREDENTIALS

   # Verify on Windows
   echo %GOOGLE_APPLICATION_CREDENTIALS%
   ```

### "Permission denied" error

**Solution:**
1. Verify the service account has the "Editor" role
2. Check that the Speech-to-Text API is enabled
3. Ensure the service account key is valid and not expired

### Microphone not working

**Solution:**
1. Check browser permissions:
   - Chrome: Settings → Privacy and security → Site settings → Microphone
   - Firefox: Preferences → Privacy & Security → Permissions → Microphone
   - Safari: System Preferences → Security & Privacy → Microphone
2. Verify microphone is connected and working
3. Try a different browser
4. Restart the browser

### Transcription not working

**Solution:**
1. Check internet connection
2. Verify Google Cloud credentials are set
3. Check that Speech-to-Text API is enabled
4. Verify audio file is valid (WAV, WebM, or MP3)
5. Check audio duration (1 second to 5 minutes)
6. Check audio file size (max 25MB)

### "Audio format not supported"

**Solution:**
1. Ensure audio is in WAV, WebM, or MP3 format
2. Check that audio encoding is correct
3. Try recording again with a different microphone

## Performance Tips

1. **Reduce Audio File Size**
   - Use mono recording (already default)
   - Use 16kHz sample rate (already default)
   - Keep recordings under 5 minutes

2. **Improve Transcription Accuracy**
   - Speak clearly and at normal volume
   - Minimize background noise
   - Use a good quality microphone

3. **Optimize Network Usage**
   - Ensure stable internet connection
   - Close other bandwidth-heavy applications
   - Use a wired connection if possible

## Security Considerations

1. **Protect Service Account Key**
   - Never commit the JSON key to version control
   - Add to `.gitignore`:
     ```
     service-account-key.json
     .env
     ```

2. **Use Environment Variables**
   - Store credentials in environment variables
   - Never hardcode credentials in code

3. **Restrict API Access**
   - Limit service account permissions to Speech-to-Text API only
   - Use API quotas to prevent abuse
   - Monitor API usage in Cloud Console

4. **Secure Audio Data**
   - Audio is sent over HTTPS
   - Audio is not stored on the server
   - Audio is deleted after transcription

## Next Steps

1. Test the voice recording feature in the interview
2. Verify transcription accuracy
3. Adjust audio settings if needed
4. Deploy to production with proper credentials management
5. Monitor API usage and costs

## Support

For issues or questions:
1. Check the [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
2. Review the [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
3. Check browser console for error messages
4. Verify all environment variables are set correctly
