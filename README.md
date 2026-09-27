# JOSVEXA Power Link

A Firebase web prototype for creating shareable Power Links with explicit recipient consent for camera, microphone, video and location.

## Setup
1. Enable Email/Password and Google in Firebase Authentication.
2. Add your deployed domain under Authentication > Settings > Authorized domains.
3. Create a Realtime Database and paste `database.rules.json` into Rules.
4. Host these files on HTTPS (Firebase Hosting is recommended). Camera, microphone and geolocation require a secure context.
5. Open `index.html` through a web server, not by relying on `file://`.

## Important
This version is a functional prototype. Media is temporarily stored as small data URLs in Realtime Database for demonstration. Production should move photos/audio/video to Firebase Storage and use tighter validation, quotas, abuse protection and preferably a trusted backend/Cloud Functions for public session creation.


V3 FIX: Firebase Web API key was corrected to exactly match the project config supplied by the owner. Google buttons are icon-only.

V4 behavior:
- Generated links are saved in Realtime Database, so refreshing the dashboard does not remove them.
- Dashboard shows Created date, Open Date, and session count.
- After the recipient explicitly selects features and presses Allow, browser permission prompts are shown.
- If Camera is allowed, one photo is captured automatically after the camera is ready.
- If Microphone/Voice or Video is allowed, recording starts automatically for the configured duration (3-30 seconds).
- If Location is allowed, location is requested automatically and saved.
- Photos/audio/video are uploaded to Firebase Storage and their URLs are saved in Realtime Database.
- Deploy `storage.rules` in Firebase Storage Rules and enable Firebase Storage in the project.


V5 media policy:
- Power Link, sessions, open date, photo and location are stored in Realtime Database.
- Audio/video are recorded automatically for the configured few seconds after consent, but remain only in the recipient browser session. They are not uploaded to Firebase Storage or Realtime Database. Refreshing/closing the recipient page removes access to those recordings.
- Camera photo is compressed and stored as a data URL in Realtime Database; keep photo limits small to avoid RTDB quota usage.
