JOSVEXA POWER LINK V6

This version keeps Power Links in Firebase Realtime Database so they remain after refresh/logout.
Audio/video recordings stay only in the recipient browser session and are not uploaded to Firebase Storage.
Photos and location are stored in Realtime Database after explicit recipient consent.

IMPORTANT:
1. Replace your GitHub files with the contents of this folder.
2. In Firebase Console -> Realtime Database -> Rules, paste database.rules.json.
3. Redeploy on Vercel.
4. Create a NEW Power Link and refresh Dashboard. It should remain visible.

If old links were created with an earlier version and are missing, check Realtime Database -> powerLinks to see whether they actually exist.
