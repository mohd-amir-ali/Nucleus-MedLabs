# Security review and operating limits

This release received source review, dependency auditing, controlled local tests and packaging checks. It is not an independent penetration-test certification or proof of production capacity.

## Controls in place

- Android and Pages use a device workspace with no API secrets or privileged backend credential.
- Build output is an explicit public-asset subset. The source archive is also allowlisted. Databases, environment files, keystores, dependency directories and generated outputs are excluded.
- The page has a Content Security Policy, blocks script execution from external hosts, and uses same-origin application data. Existing inline styles remain permitted; inline scripts do not.
- Reading links are HTTPS and restricted to Nucleus MedLabs, FDA, WHO, ICH, ClinicalTrials.gov and OpenWHO hosts. Article text renders with textContent. Oversized catalogues, credential-bearing URLs, unsupported hosts and arbitrary image paths are rejected. Saved article metadata is validated when importing a workspace.
- Imported workspace data cannot set authentication or replace account identity. Input size, known IDs and history counts are bounded.
- The optional local API uses parameterized SQLite queries, password hashing with a per-password salt, hashed session/recovery tokens, HttpOnly/SameSite cookies, request-origin checks, authentication throttling and revision-based conflict detection.
- Static servers reject directory listings and resolved paths outside their public directory, including symlink escapes. API responses are not cached in the service worker. Errors do not return stack traces or database contents.
- Android disables mixed content, cleartext requests, automatic OS backup and WebView debugging in the configured app. Its native export uses the cache-directory FileProvider and Android's share sheet.
- GitHub Actions dependencies are pinned to inspected commit SHAs. Workflows use scoped permissions; release credentials are GitHub secrets and are not put in artifacts.

## Demonstration access

The Android/Pages login is only for experiencing the interface. Its SHA-256 verifier is shipped in public JavaScript and is not secure authentication or password storage. It can be bypassed or guessed. Do not reuse the demonstration password for any real account. No credentials appear in UI copy, backup exports or persisted workspace data. Automated tests contain the non-secret demonstration fixture.

The display name is validated and escaped where inserted into HTML. Sign-in state is memory-only, Back navigation respects sign-out, and all demonstration names share the same device workspace. This is not multi-user account isolation. Corrupt device storage is not silently replaced: the app reports an error and lets the user export current work before clearing data.

## Data handling

Workspace backups are readable JSON. LocalStorage and Android Preferences are not encrypted vaults. Do not store patient information, identity documents, passwords or access tokens in custom skill fields. Use Settings to export or clear the device workspace. Clearing browser/app data or uninstalling can delete local progress.

The optional Python account pilot is intended for local development and trusted Wi-Fi with test credentials. Production use needs HTTPS, a managed deployment, hardened authentication, durable backups, observability and explicit data-retention/deletion controls. A local account contact is unverified. No OTP or delivery provider is connected.

## Limits of the checks

The source scanner catches several common credential formats, private-key headers, prohibited punctuation, emoji ranges and production console logging. Passing it does not prove that every possible secret format is absent. Dependency audit results reflect the advisory data available when run and can change.

Tests cover account isolation, invalid credentials, session/recovery behavior, cross-origin writes, private-file exposure, malformed reading data, workspace imports, save retries and concurrent revision conflicts. The concurrency case exercises ten competing saves to a temporary database and verifies exactly one revision wins. It does not simulate an internet-facing service under hostile load.

Browser viewport tests are included for CI. Their reports and a physical Android acceptance pass are required before broad distribution. There is no claim of universal device compatibility, Play approval or a currently provisioned cloud backend.

If you discover a problem, contact the maintainer privately. Do not post tokens, keystores, account exports or private database files in public issues. Rotate any exposed credential rather than merely deleting it from the latest commit.
