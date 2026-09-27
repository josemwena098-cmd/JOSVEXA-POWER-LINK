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
