# Accessibility Architecture & UX Guidelines — Project ANT

## Core Philosophy: Independence Without Sighted Dependence
Project ANT is built on the principle that blind and visually impaired employees should navigate familiar workplace environments independently, without needing to ask a colleague for directions or struggle with inaccessible touchscreens.

---

## 1. Interaction Paradigm

### Audio-First and Screen-Agnostic
- **Rule 7 Compliance**: The entire navigation lifecycle is operable with a completely blacked-out or covered screen.
- **Audio Earcons**: Short distinctive auditory cues indicate state events:
  - Rising chime: Tag detected / Checkpoint reached.
  - Alert buzz: Obstacle ahead.
  - Success arpeggio: Destination reached.
- **Concise Speech (Rule 9 & Rule 16)**: Spoken announcements are brief, directional, and action-oriented:
  - Good: "Walk straight toward the elevator."
  - Bad: "You are currently approaching the corridor that will lead to the elevators in 15.4 feet."

### Non-Visual Control
- Large, high-contrast, tactile-accessible interactive surfaces.
- Global keyboard hotkeys:
  - `Space`: Push-to-talk / Voice command trigger.
  - `Enter`: Repeat last instruction.
  - `Escape`: Cancel / Stop navigation.
- Native ARIA live regions (`aria-live="assertive"` for obstacle alerts; `aria-live="polite"` for route updates).

---

## 2. Visual Accessibility for Low-Vision Users & Judges
- High-contrast color palette exceeding WCAG AAA 7:1 ratio:
  - Background: `#0d1117` (Deep slate)
  - Text: `#f0f6fc` (High-contrast bright white)
  - Accent / Focus rings: `#58a6ff` (4.5px solid border)
  - Warning: `#f85149` (Vivid crimson)
  - Landmark / Success: `#3fb950` (Vivid emerald)
- Scalable typography using modern accessible fonts with generous line height and letter spacing.
