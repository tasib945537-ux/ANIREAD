# ANIREAD Android build

ANIREAD keeps its existing React screens and features. The Android app is a Capacitor shell around the same built web app.

## APK
GitHub Actions builds a debug APK after each push to `main`. Open Actions, select **ANIREAD Android APK**, and download the **ANIREAD-Android-APK** artifact after the run succeeds.

## Backend required for server APIs
The Android package cannot run the Express server inside its WebView. Deploy the included `render.yaml` blueprint to Render as the `aniread-api` web service. The deployment downloads the anime-offline-database dataset into the backend; the dataset is not committed to this repository.

If your Render URL differs from `https://aniread-api.onrender.com`, set the GitHub Actions repository variable `ANIREAD_API_URL` to your actual API base URL (no trailing slash).

## Notes
- The Hindi Dub Admin dashboard and public dub database mutation endpoints have been removed. Public dub data remains read-only.
- Community posting and reactions require a registered, signed-in community account. Demo profiles no longer have shared passwords or static login tokens.
- Firestore admin overrides are disabled. User-owned profile, favorites, dub list, and reading progress rules remain.
- Anime catalog, anime details, manga reader, translator, and existing UI source files are retained.
- The offline anime dataset is downloaded during backend deployment and remains subject to its upstream open-database license.
