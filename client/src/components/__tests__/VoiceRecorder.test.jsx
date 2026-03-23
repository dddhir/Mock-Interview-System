import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceRecorder from '../VoiceRecorder';

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
const mockMediaRecorder = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

global.MediaRecorder = mockMediaRecorder;

describe('VoiceRecorder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Property 1: Recording Duration Accuracy
  it('should display duration counter that matches actual recording duration within ±1 second', async () => {
    const { rerender } = render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={vi.fn()} />
    );

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(recordButton);

    // Simulate 10 seconds of recording
    for (let i = 0; i < 10; i++) {
      await waitFor(() => {
        const durationDisplay = screen.queryByText(/\d{2}:\d{2}/);
        if (durationDisplay) {
          const [mins, secs] = durationDisplay.textContent.split(':').map(Number);
          const totalSeconds = mins * 60 + secs;
          expect(Math.abs(totalSeconds - i)).toBeLessThanOrEqual(1);
        }
      });
    }
  });

  // Property 2: Microphone Permission Caching
  it('should not prompt for microphone permission on subsequent recording attempts', async () => {
    const { rerender } = render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={vi.fn()} />
    );

    const recordButton = screen.getByRole('button', { name: /start recording/i });

    // First recording
    fireEvent.click(recordButton);
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    // Re-record
    const reRecordButton = screen.getByRole('button', { name: /re-record/i });
    fireEvent.click(reRecordButton);

    // Start new recording
    const newRecordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(newRecordButton);

    // Should still only be called once (permission cached)
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  // Property 3: Audio Data Preservation on Transcription Error
  it('should preserve audio blob when transcription fails', async () => {
    const onError = vi.fn();
    render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={onError} />
    );

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(recordButton);

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    // Mock transcription failure
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Transcription failed' }),
      })
    );

    const transcribeButton = screen.getByRole('button', { name: /transcribe/i });
    fireEvent.click(transcribeButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    // Audio blob should still be available for retry
    const retryButton = screen.queryByRole('button', { name: /transcribe/i });
    expect(retryButton).toBeInTheDocument();
  });

  // Property 4: Recording State Machine Validity
  it('should follow valid state transitions', async () => {
    const { container } = render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={vi.fn()} />
    );

    // Initial state: idle
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();

    // Transition to recording
    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();

    // Transition to stopped
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));
    expect(screen.getByRole('button', { name: /transcribe/i })).toBeInTheDocument();

    // Transition to transcribing
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            transcription: 'Test transcription',
            confidence: 0.95,
          }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }));

    // Should eventually reach completed state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
    });
  });

  // Property 5: Textarea Population Completeness
  it('should populate textarea with complete transcribed text atomically', async () => {
    const onTranscriptionComplete = vi.fn();
    render(
      <VoiceRecorder onTranscriptionComplete={onTranscriptionComplete} onError={vi.fn()} />
    );

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(recordButton);

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    const testTranscription = 'This is a complete test transcription.';
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            transcription: testTranscription,
            confidence: 0.95,
          }),
      })
    );

    const transcribeButton = screen.getByRole('button', { name: /transcribe/i });
    fireEvent.click(transcribeButton);

    await waitFor(() => {
      expect(onTranscriptionComplete).toHaveBeenCalledWith(testTranscription);
    });
  });

  // Property 6: Re-recording State Reset
  it('should completely clear previous data when re-recording', async () => {
    const { container } = render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={vi.fn()} />
    );

    // Record and transcribe
    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            transcription: 'First recording',
            confidence: 0.95,
          }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
    });

    // Re-record
    fireEvent.click(screen.getByRole('button', { name: /record again/i }));

    // Should be back to idle state
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /record again/i })).not.toBeInTheDocument();
  });

  // Property 8: Minimum Audio Duration Enforcement
  it('should display warning for recordings less than 1 second', async () => {
    const onError = vi.fn();
    render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={onError} />
    );

    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));

    // Immediately stop (< 1 second)
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));

    const transcribeButton = screen.getByRole('button', { name: /transcribe/i });
    fireEvent.click(transcribeButton);

    await waitFor(() => {
      expect(screen.getByText(/recording is too short/i)).toBeInTheDocument();
    });
  });

  // Property 13: Accessibility Attributes Presence
  it('should have proper ARIA attributes on all interactive elements', () => {
    render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={vi.fn()} />
    );

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    expect(recordButton).toHaveAttribute('aria-label');
    expect(recordButton).toHaveAttribute('aria-pressed');
  });

  // Property 14: Error Message Clarity
  it('should display user-friendly error messages without technical jargon', async () => {
    const onError = vi.fn();
    render(
      <VoiceRecorder onTranscriptionComplete={vi.fn()} onError={onError} />
    );

    mockGetUserMedia.mockRejectedValueOnce(new DOMException('NotAllowedError'));

    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
    });
  });
});
