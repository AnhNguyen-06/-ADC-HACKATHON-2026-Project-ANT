# Security & Privacy Policy — Project ANT

## 1. Data Privacy Principles (Rule 11 Compliance)

### Zero Persistent Image/Audio Retention
- Video frames captured from the user's webcam are processed strictly in volatile memory (RAM) for real-time AprilTag and obstacle bounding box extraction.
- Frames are immediately discarded after inference; no raw video or photo files are saved to disk.
- Microphone audio streams are transcribed in-browser or streamed to local backend memory and discarded immediately following intent classification.

### Local-First Network Isolation
- All core vision, routing, and speech services execute on localhost (`127.0.0.1`).
- No biometric, facial recognition, or personal employee tracking data is collected, stored, or transmitted to any remote cloud endpoint.

---

## 2. Secrets Management & Environment Security
- Zero hardcoded API tokens, credentials, or private configurations in repository source code.
- Configuration managed via standard environment variables and `.env.example`.
- `.gitignore` strictly configured to block `.env`, credentials, and temporary build caches.

---

## 3. Assistive Safety Disclaimer (Rule 10 Compliance)
- Project ANT is an experimental assistive hackathon prototype, NOT a medical mobility device, certified white cane replacement, or certified collision avoidance system.
- Users must use appropriate standard mobility aids (e.g. guide dog, white cane) during real-world navigation.
