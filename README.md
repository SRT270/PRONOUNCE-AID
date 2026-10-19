# Pronounce Aid

**Pronounce Aid** is a browser-based pronunciation and literacy practice application designed for K–8 learners. It combines speech input, text-to-speech audio, phoneme-focused feedback, short learning games, and progress tracking to make pronunciation practice more accessible and engaging.

> **Project status:** This README describes the features visible in the supplied source code. Speech recognition and speech synthesis depend on browser support. The pronunciation analysis currently uses a rule-based grapheme-to-phoneme approximation and compares the recognized transcript; it is not a trained acoustic pronunciation model and should not be treated as a clinical or diagnostic assessment.

## Features

- **Speech-based pronunciation practice:** Record a spoken word using the browser's Web Speech API and compare the recognized transcript with the target word.
- **Pronunciation feedback:** Estimate a word-level match score using a lightweight token comparison and show the first detected mismatch with a relevant phoneme tip when available.
- **Text-to-speech (TTS):** Play target words, clues, and audio guidance with adjustable speech rate.
- **Phoneme learning:** Explore sound examples and tips through a built-in phoneme reference set.
- **Interactive learning games:**
  - **Sound Match** — practice phoneme identification and rhyming.
  - **Repeat Race** — listen to a word, repeat it, and check the recognized response.
  - **Mystery Word** — guess a word from audio clues.
  - **Spelling Learning** — practice spelling with audio support and feedback.
- **Progress tracking:** Save practice attempts, correct responses, time spent, XP, levels, badges, and per-phoneme statistics in browser `localStorage`.
- **Learner accessibility settings:** Toggle audio assistance, adjust speech rate, enable a dyslexia-friendly font option, and switch dark mode.
- **Progress dashboard:** Review accuracy, time spent, level, XP, phoneme breakdown, and badges.
- **Responsive interface:** React-based pages styled with Tailwind CSS and reusable UI components.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Styling and UI:** Tailwind CSS, Radix UI, Lucide React
- **Speech features:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition` and `SpeechSynthesisUtterance`)
- **Progress persistence:** Browser `localStorage`
- **Application/tooling:** Node.js, pnpm or npm, Vitest, Zod, Express-related starter configuration
- **Deployment configuration:** Vite and Netlify configuration are included in the repository

## Getting Started

### Prerequisites

- Node.js (use a current LTS release)
- npm or pnpm
- Chrome or Microsoft Edge recommended for speech recognition support
- A working microphone and permission to access it for speech-based activities

### Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/SRT270/PRONOUNCE-AID.git
cd PRONOUNCE-AID
```

Install dependencies with **pnpm**:

```bash
pnpm install
```

Or use **npm**:

```bash
npm install
```

### Run the development server

```bash
pnpm dev
```

Or:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal. The Vite configuration uses port `8080` by default.

### Build for production

```bash
pnpm build
```

Or:

```bash
npm run build
```

Other available scripts:

```bash
pnpm typecheck  # TypeScript type checking
pnpm test       # Run Vitest tests
pnpm start      # Start the built server, if the server build is available
```

Equivalent npm commands can be used where applicable, such as `npm run typecheck` and `npm test`.

## How to Use

1. Open the application in a supported browser.
2. Visit **Practice** and choose a target word.
3. Allow microphone access when prompted, then record the spoken word.
4. Check the recognized result and review the displayed score and phoneme guidance.
5. Use **Games** to practice sound matching, repetition, mystery words, and spelling.
6. Visit **Progress** or the **Teacher/Parent dashboard** to review saved learning statistics.
7. Open **Settings** to adjust speech rate, audio assistance, font accessibility, and theme preferences.

Speech recognition is not available in every browser. If recording does not work, try an up-to-date version of Chrome or Edge and verify microphone permissions. Text-to-speech support also depends on the browser and available system voices.

## Project Structure

```text
client/
├── App.tsx                         # App shell and client-side routes
├── global.css                      # Global styles and theme
├── components/
│   ├── pronounce-aid/
│   │   └── PhonemeData.ts           # Word list and phoneme learning tips
│   └── ui/                          # Reusable interface components
├── contexts/
│   └── AuthContext.tsx              # Client authentication state
├── hooks/
│   └── useAudioAssist.tsx           # Audio assistance preference/context
├── pages/
│   ├── Index.tsx                    # Landing page
│   ├── Practice.tsx                 # Speech-based practice
│   ├── Games.tsx                    # Game menu
│   ├── SoundMatchGame.tsx           # Phoneme/rhyme matching
│   ├── RepeatRaceGame.tsx           # Repeat-after-me activity
│   ├── MysteryWordGame.tsx          # Audio-clue word game
│   ├── SpellingLearningGame.tsx     # Spelling activity
│   ├── Progress.tsx                 # Learning progress
│   ├── Dashboard.tsx                # Detailed progress dashboard
│   ├── Settings.tsx                 # Accessibility and audio settings
│   ├── Login.tsx                    # Login interface
│   └── Signup.tsx                   # Registration interface
└── utils/
    └── speech.ts                    # Speech synthesis, recognition, and token analysis

netlify/
└── functions/
    └── api.ts                       # Netlify function adapter

package.json                         # Scripts and dependencies
vite.config.ts                       # Vite configuration
netlify.toml                         # Netlify configuration
```

## How Pronunciation Feedback Works

The current implementation follows a lightweight, rule-based approach:

1. The browser's speech recognition API returns a transcript for the learner's spoken response.
2. The target word and recognized text are normalized and converted into approximate letter/sound tokens using predefined English spelling rules.
3. A longest-common-subsequence comparison estimates token overlap and produces a score from 0 to 100.
4. A score of at least 80 is treated as a correct response in the current utility logic.
5. The interface can use the first detected mismatch to show a corresponding learning tip, where available.

**Important limitation:** This is a heuristic over recognized text, not direct acoustic or phonetic analysis of the learner's waveform. Speech-recognition errors, accents, background noise, and English spelling irregularities can affect the result. The score should be interpreted as practice feedback rather than a validated pronunciation measurement.

## Data and Privacy Notes

- Learning progress and several preferences are stored in the browser's `localStorage`.
- Speech recognition is provided by the browser's Web Speech API. Its processing and privacy behavior depend on the browser and platform.
- The supplied source includes login and signup client code that calls `/api/auth/login` and `/api/auth/signup`. Verify that corresponding backend routes are configured before relying on authentication in a deployment.
- Do not commit real credentials, API keys, or private environment values. Configure deployment secrets through the platform's environment-variable settings instead.

## Testing and Quality Checks

Run the available test suite:

```bash
pnpm test
```

Run TypeScript checks:

```bash
pnpm typecheck
```

Build the project before deployment:

```bash
pnpm build
```

The supplied archive may not contain every backend or shared source file referenced by the client and build configuration. If installation, type checking, authentication, or production builds fail, verify that the complete repository includes those files and that required API routes are deployed.

## Future Improvements

- Replace the heuristic token comparison with validated phoneme-level alignment or acoustic pronunciation assessment.
- Evaluate feedback quality against a representative set of speech samples and document limitations across accents and learner groups.
- Improve handling of English grapheme-to-phoneme irregularities and multiword responses.
- Add educator-managed learner profiles and secure server-side progress storage if required.
- Add automated tests for speech utilities, progress calculations, accessibility settings, and game flows.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Open a pull request describing the change and any relevant testing.
