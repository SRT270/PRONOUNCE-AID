# TODO: Add Retry/Next Buttons to Games

## Steps to Complete:

1. **Update MysteryWordGame.tsx** [x]
   - Add state for showing buttons (e.g., showButtons).
   - In submitGuess: After setting feedback and updating progress (on correct), set showButtons=true. Remove auto-advance and timeouts.
   - Render Retry and Next buttons below feedback when showButtons=true.
   - Retry: Reset userGuess="", feedback="", clueLevel=1, playClue(targetWord, 1), set showButtons=false.
   - Next: generateWord(), set showButtons=false.
   - Ensure progress only updates on correct guess.

2. **Update SpellingLearningGame.tsx** [x]
   - Add state for showing buttons (e.g., showButtons).
   - In submitSpelling: After setting feedback and updating progress (on correct or partial), set showButtons=true. Remove timeouts.
   - For mistakes >=3: Show correct spelling, set showButtons=true.
   - Render Retry and Next buttons below feedback when showButtons=true.
   - Retry: Reset userSpelling="", feedback="", mistakes=0, errorPhoneme="", showCorrect=false, speak word, set showButtons=false.
   - Next: generateWord(), set showButtons=false.
   - Progress updates as before (full on correct, partial on incorrect).

3. **Update SoundMatchGame.tsx** [x]
   - Add state for showing buttons (e.g., showButtons).
   - In onPick: After setting feedback and updating progress (on correct), set showButtons=true. Remove setTimeout(generateRound).
   - Render Retry and Next buttons below feedback when showButtons=true.
   - Retry: Reset feedback="", score=0, playSound(), set showButtons=false.
   - Next: generateRound(), set showButtons=false.
   - Progress updates only on correct pick.

4. **Testing** [x]
   - Verify no syntax errors (HMR updates without crashes).
   - Test MysteryWordGame: Load, guess wrong -> buttons appear, retry resets guess/clue, next generates new; correct -> progress + buttons.
   - Test SpellingLearningGame: Load, wrong guess -> buttons, retry resets input/mistakes/hears word; 3 wrongs -> reveal + buttons; correct -> progress + buttons.
   - Test SoundMatchGame: Load, pick wrong -> buttons, retry resets feedback/plays sound; correct -> progress + buttons.
   - Check localStorage for progress persistence, no console errors, no regressions in other features.

5. **Completion** [x]
   - All updates applied and tested successfully.
