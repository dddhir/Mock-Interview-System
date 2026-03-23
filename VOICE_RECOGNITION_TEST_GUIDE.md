# Voice Recognition - Test Guide

## Quick Test (2 minutes)

### Step 1: Start Interview
1. Go to http://localhost:3000
2. Login or create account
3. Start a new interview
4. Wait for first question to load

### Step 2: Test Voice Recording
1. Look for "Voice Recognition" section above "Your Answer" textarea
2. Click "Start Speaking" button
3. Grant microphone permission (if prompted)
4. Speak clearly: "Hello, this is my answer to the interview question"
5. Watch text appear in real-time in the Voice Recognition box

### Step 3: Test Auto-Population
1. Click "Stop" button
2. **Expected:** Text automatically appears in "Your Answer" textarea
3. Verify text is complete and accurate

### Step 4: Test Submission
1. Click "Submit Answer" button
2. Verify answer is processed normally
3. Check score and feedback

## Detailed Test Cases

### Test 1: Basic Recording
**Objective:** Verify basic recording and auto-population works

**Steps:**
1. Click "Start Speaking"
2. Say: "Operating systems manage hardware resources"
3. Click "Stop"
4. Verify text appears in textarea

**Expected Result:** ✅ Text appears immediately in textarea

---

### Test 2: Live Transcription
**Objective:** Verify text appears in real-time while speaking

**Steps:**
1. Click "Start Speaking"
2. Speak slowly: "The quick brown fox"
3. Watch the Voice Recognition box
4. Click "Stop"

**Expected Result:** ✅ Text appears word-by-word in real-time

---

### Test 3: Stop Button Works
**Objective:** Verify Stop button properly stops recording

**Steps:**
1. Click "Start Speaking"
2. Speak for 3 seconds
3. Click "Stop"
4. Try to speak more
5. Verify no new text is added

**Expected Result:** ✅ Recording stops, no new text added

---

### Test 4: Re-recording
**Objective:** Verify re-recording clears previous text

**Steps:**
1. Record: "First answer"
2. Click "Stop"
3. Verify text in textarea
4. Click "Record Again"
5. Record: "Second answer"
6. Click "Stop"

**Expected Result:** ✅ New text replaces old text in textarea

---

### Test 5: Error Handling
**Objective:** Verify error messages display correctly

**Steps:**
1. Click "Start Speaking"
2. Deny microphone permission
3. Verify error message appears

**Expected Result:** ✅ Clear error message displayed

---

### Test 6: Duration Counter
**Objective:** Verify duration counter works

**Steps:**
1. Click "Start Speaking"
2. Watch duration counter
3. Speak for 5 seconds
4. Verify counter shows 00:05

**Expected Result:** ✅ Counter increments correctly

---

### Test 7: Auto-Stop at 5 Minutes
**Objective:** Verify recording auto-stops at 5 minutes

**Steps:**
1. Click "Start Speaking"
2. Wait 5 minutes (or simulate by checking code)
3. Verify recording stops automatically

**Expected Result:** ✅ Recording stops at 5 minutes

---

### Test 8: Multiple Answers
**Objective:** Verify voice recording works for multiple questions

**Steps:**
1. Record and submit first answer
2. Move to next question
3. Record second answer
4. Verify both work correctly

**Expected Result:** ✅ Voice recording works for all questions

---

## Checklist

### Functionality
- [ ] Start Speaking button works
- [ ] Stop button works
- [ ] Text appears in real-time
- [ ] Text auto-populates textarea
- [ ] Re-recording works
- [ ] Duration counter works
- [ ] Auto-stop at 5 minutes works

### User Experience
- [ ] Clear visual feedback (pulsing dot while recording)
- [ ] Status messages are clear
- [ ] Buttons are responsive
- [ ] No lag or delays
- [ ] Text is readable

### Error Handling
- [ ] Microphone permission denied handled
- [ ] No microphone found handled
- [ ] Network error handled
- [ ] Error messages are clear

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### Integration
- [ ] Text appears in textarea
- [ ] Answer can be submitted
- [ ] Score is calculated
- [ ] Feedback is displayed

## Troubleshooting

### Text Not Appearing
1. Check microphone is connected
2. Check microphone is not muted
3. Speak louder and clearer
4. Try different browser

### Stop Button Not Working
1. Refresh page
2. Try different browser
3. Check browser console for errors

### Text Not Auto-Populating
1. Verify callback is working
2. Check browser console for errors
3. Verify Interview component is updated

### Microphone Permission Issues
1. Check browser microphone settings
2. Allow microphone access
3. Restart browser

## Performance Metrics

| Metric | Expected | Actual |
|--------|----------|--------|
| Start latency | < 500ms | |
| Text display latency | < 100ms | |
| Stop latency | < 50ms | |
| Auto-populate latency | < 100ms | |
| Memory usage | < 10MB | |

## Notes

- Test on different microphones if possible
- Test in quiet and noisy environments
- Test with different accents and speaking speeds
- Test with different languages (if supported)

## Sign-Off

- [ ] All tests passed
- [ ] No bugs found
- [ ] Ready for production
- [ ] User feedback positive

---

**Test Date:** ___________
**Tester:** ___________
**Status:** ___________
