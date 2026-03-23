const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

const client = new speech.SpeechClient();

const SUPPORTED_FORMATS = ['wav', 'webm', 'mp3'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MIN_DURATION = 1; // 1 second
const MAX_DURATION = 300; // 5 minutes

/**
 * Validate audio file format and size
 */
const validateAudio = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Audio file is too large. Maximum size is 25MB.',
      code: 'AUDIO_TOO_LARGE',
    };
  }

  // Check format from mimetype or filename
  const mimeType = file.mimetype || '';
  const filename = file.originalname || '';
  const ext = path.extname(filename).toLowerCase().slice(1);

  const isValidFormat =
    SUPPORTED_FORMATS.includes(ext) ||
    mimeType.includes('audio/wav') ||
    mimeType.includes('audio/webm') ||
    mimeType.includes('audio/mpeg');

  if (!isValidFormat) {
    return {
      valid: false,
      error: 'Audio format not supported. Please use WAV, WebM, or MP3.',
      code: 'INVALID_AUDIO_FORMAT',
    };
  }

  return { valid: true };
};

/**
 * Get audio encoding based on file format
 */
const getAudioEncoding = (format) => {
  const encodingMap = {
    wav: 'LINEAR16',
    webm: 'WEBM_OPUS',
    mp3: 'MP3',
  };
  return encodingMap[format] || 'LINEAR16';
};

/**
 * Transcribe audio using Google Cloud Speech-to-Text
 */
const transcribeAudio = async (audioBuffer, format = 'wav') => {
  try {
    const encoding = getAudioEncoding(format);

    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: encoding,
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'latest_long',
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join('\n');

    // Calculate confidence from results
    const confidence =
      response.results.length > 0
        ? response.results[0].alternatives[0].confidence || 0.8
        : 0;

    return {
      success: true,
      transcription,
      confidence,
      duration: response.results.length > 0 ? response.results[0].resultEndTime : 0,
    };
  } catch (error) {
    console.error('Transcription error:', error);

    if (error.code === 3) {
      return {
        success: false,
        error: 'Transcription service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      };
    }

    if (error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Transcription took too long. Please try again.',
        code: 'TRANSCRIPTION_TIMEOUT',
      };
    }

    return {
      success: false,
      error: 'Failed to transcribe audio. Please try again.',
      code: 'TRANSCRIPTION_FAILED',
    };
  }
};

module.exports = {
  validateAudio,
  transcribeAudio,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MIN_DURATION,
  MAX_DURATION,
};
