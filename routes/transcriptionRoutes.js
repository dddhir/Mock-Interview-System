const express = require('express');
const multer = require('multer');
const { validateAudio, transcribeAudio } = require('../services/transcriptionService');

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

/**
 * POST /api/interview/transcribe
 * Transcribe audio to text
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
        code: 'NO_AUDIO_FILE',
      });
    }

    // Validate audio
    const validation = validateAudio(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        code: validation.code,
      });
    }

    // Get format from request or derive from filename
    const format = req.body.format || req.file.originalname.split('.').pop().toLowerCase();

    // Transcribe audio
    const result = await transcribeAudio(req.file.buffer, format);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code,
      });
    }

    // Return transcription
    res.json({
      success: true,
      transcription: result.transcription,
      confidence: result.confidence,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Transcription endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
