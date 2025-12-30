# Frenchie - French Learning App Design Document

## Overview
Frenchie is a simple, elegant French vocabulary learning app targeting A2-B2 level learners. The app uses a flashcard-based approach with spaced repetition tracking based on user feedback (remember/forgot).

## Design Philosophy
- **Minimalist**: Clean interface showing only the French word initially
- **One-handed use**: All interactions accessible with thumb
- **Focus on learning**: No distractions, just the word and learning controls

---

## Screen List

### 1. Home Screen (Flashcard View)
The main learning interface showing flashcards one at a time.

### 2. Forgot List Screen
A list view showing all words the user has marked as "forgot", sorted by forgetting frequency (most forgotten at top).

---

## Primary Content and Functionality

### Home Screen (Flashcard View)
**Initial State (Card Front):**
- Large French word/phrase displayed prominently in center
- Subtle tap hint: "Tap to reveal"
- Word level indicator (A2/B1/B2) as small badge

**Revealed State (Card Back):**
- French word remains visible at top
- English translation appears below
- Example sentence in French with English translation
- Two action buttons at bottom:
  - "Forgot" (left) - red/orange tinted
  - "Remember" (right) - green tinted

**Data per Card:**
- French word/phrase
- English meaning
- Example sentence (French)
- Example sentence translation (English)
- CEFR level (A2/B1/B2)
- Category (word/phrase/expression)

### Forgot List Screen
- Header: "Words to Review" with count
- FlatList of forgotten words sorted by forgot count (descending)
- Each item shows:
  - French word
  - English meaning (smaller)
  - Forgot count badge
  - Tap to practice this word

---

## Key User Flows

### Flow 1: Learning New Words
1. User opens app → Home screen with flashcard
2. User sees French word only
3. User taps card → English meaning + example revealed
4. User taps "Remember" or "Forgot"
5. Next card appears automatically
6. Progress saved locally

### Flow 2: Reviewing Forgotten Words
1. User taps "Forgot List" tab
2. Sees list of words sorted by forgot frequency
3. Taps a word → Goes to that card in flashcard view
4. Reviews and marks remember/forgot
5. If "Remember" pressed, forgot count decreases

---

## Color Choices

### Brand Colors
- **Primary (French Blue)**: #0055A4 - Main accent, buttons
- **Background Light**: #FAFBFC - Clean white-ish
- **Background Dark**: #1A1A2E - Deep navy for dark mode
- **Surface Light**: #FFFFFF - Cards
- **Surface Dark**: #252540 - Cards in dark mode
- **Foreground Light**: #1A1A2E - Text
- **Foreground Dark**: #F5F5F7 - Text in dark mode
- **Muted Light**: #6B7280 - Secondary text
- **Muted Dark**: #9CA3AF - Secondary text dark

### Semantic Colors
- **Success/Remember**: #22C55E (green)
- **Warning/Forgot**: #F59E0B (amber/orange)
- **Error**: #EF4444 (red)

### Level Badge Colors
- **A2**: #3B82F6 (blue)
- **B1**: #8B5CF6 (purple)
- **B2**: #EC4899 (pink)

---

## Layout Specifications

### Flashcard (Home Screen)
```
┌─────────────────────────────┐
│  [A2]              Frenchie │  ← Header with level badge
├─────────────────────────────┤
│                             │
│                             │
│         bonjour             │  ← French word (large, centered)
│                             │
│      tap to reveal          │  ← Hint text (muted)
│                             │
│                             │
├─────────────────────────────┤
│                             │
│   [  Forgot  ] [Remember ]  │  ← Action buttons (hidden until revealed)
│                             │
└─────────────────────────────┘
```

### Revealed State
```
┌─────────────────────────────┐
│  [A2]              Frenchie │
├─────────────────────────────┤
│                             │
│         bonjour             │  ← French word
│                             │
│          hello              │  ← English meaning
│                             │
│  "Bonjour, comment allez-   │  ← Example sentence
│   vous?"                    │
│  "Hello, how are you?"      │  ← Translation
│                             │
├─────────────────────────────┤
│                             │
│   [  Forgot  ] [Remember ]  │  ← Buttons now visible
│                             │
└─────────────────────────────┘
```

### Forgot List Screen
```
┌─────────────────────────────┐
│     Words to Review (12)    │  ← Header with count
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ peut-être          [5x] │ │  ← Word + forgot count
│ │ maybe                   │ │  ← English meaning
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ cependant          [4x] │ │
│ │ however                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ d'ailleurs         [3x] │ │
│ │ besides                 │ │
│ └─────────────────────────┘ │
│           ...               │
└─────────────────────────────┘
```

---

## Navigation Structure

**Tab Bar (2 tabs):**
1. **Learn** (house icon) - Flashcard view
2. **Review** (list icon) - Forgot list

---

## Data Storage

All data stored locally using AsyncStorage:
- `vocabulary`: Array of all words with metadata
- `progress`: Object tracking forgot counts per word ID
- `currentIndex`: Current position in vocabulary list

---

## Interaction Details

### Card Tap
- Tap anywhere on card to reveal
- Subtle scale animation (0.98) on press
- Fade in for revealed content

### Button Press
- Light haptic feedback
- Scale animation (0.97)
- Auto-advance to next card after 300ms delay

### List Item Tap
- Navigate to flashcard view with that word
- Opacity feedback on press
