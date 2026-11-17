# Backend and storage boundaries

The published 8.6 web platform and APK run without a cloud backend. Demonstration access uses public prefilled values and is not authentication.

- Website workspace: localStorage in the current browser profile and origin.
- Android workspace: Capacitor Preferences in the app's private storage.
- No automatic cross-device sync, email, OTP, shared accounts or cloud recovery.
- Export/import in Settings transfers a workspace manually. Treat exported files as personal data.
- Consultation opens the official website; it does not create an appointment inside this release.
- Job and course actions open external searches. No live vacancy database is maintained.

The optional Python local pilot (`server.py`) contains account/request experiments using SQLite on the Mac. It is not used by GitHub Pages or the shipped APK and must not be exposed as a production server. Its runtime data and secrets are excluded from public builds and the repository.

A later server-backed release should separately design identity verification, per-user access controls, deletion, recovery, backups, rate limits and database migrations. Provider secrets belong on the server or in protected build secrets, never in bundled JavaScript. Supabase integration is deferred.
