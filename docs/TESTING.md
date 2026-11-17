# Release verification

## Preparation results

Version 8.6.0 passed the functional suite, including 168 profession/pathway combinations constrained to two A4 pages. The dependency audit reported zero known vulnerabilities. The source audit found no prohibited punctuation, emojis or credential-shaped tokens in authored source.

Both pages of a sample PDF were rendered with macOS PDFKit and inspected for branding, text wrapping and circular completion markers.

Local Chromium launch was blocked by the Mac sandbox (Mach port permission denied), so rendered viewport checks did not execute. The included CI browser suite and physical-device acceptance remain required. The signed release APK and AAB compiled with Java 21 and Android SDK 36. APK and AAB signature checks passed, and the bundled application scripts, styles and reading edition match the source. The signing certificate differs from the old 8.5.0 preview, so export the workspace before replacing that installation. Compilation does not prove physical-device acceptance.

## Automated checks

Run `npm ci`, `npm run bundle`, `npm test`, `npm run build` and `npm run audit:source`.

The suite includes 27 Python checks, 8 career-engine checks, 9 workspace checks, 10 installation/service-worker checks, one DOM integration journey covering demo login and the full assessment and 168 PDF profession/pathway combinations. The DOM test also checks exact three-second timer ticks and reduced-motion behavior. PDF tests use the real embedded fonts and generator, check two-page output and enforce page-height limits. The source audit excludes third-party and generated files from editorial punctuation checks.

GitHub additionally runs Chromium at 320x740, 360x800, 390x844, 412x915, 640x360, 800x1280 and 1280x800. It checks content overflow, 4:3 source image ratio at every viewport and persistent website viewport switching, dropdown closing/keyboard behavior, assessment/report tabs, navigation, PDF download, theme and reload persistence. Screenshots and traces are retained as workflow artifacts.

Component tests use a simulated DOM, which does not calculate layout. Passing them alone is not a visual check. Local browser automation was unavailable during preparation; the CI viewport suite must pass after publishing, and the physical-device list below remains necessary.

## OnePlus Pad and smartphone acceptance

1. Install the APK from your own GitHub Release. Check the icon in the launcher and recent-apps view, then cold-launch it. Confirm the splash leads to demonstration login. Try a wrong password, then enter your name and the shared credentials. Confirm Home greets you by name.
2. Check portrait, landscape and split screen where supported. Confirm the header, bottom navigation and keyboard do not cover actions. Test increased Android font/display size as well as default size.
3. On a phone, confirm banner people/artwork are not stretched and the heading/description sit below the image. Check that all four banners keep the complete image and existing description. Check three-second rotation, swipe and each carousel dot. There should be no Pause button or autoplay switch. Enable reduced motion and confirm autoplay stops.
4. Complete an assessment. Open every dropdown, tap the same trigger twice, dismiss outside, select a long qualification and reopen it. Check option placement near the bottom of the screen.
5. Visit Overview, Skills, Roadmap, Jobs and Courses. Confirm a skill, mark a roadmap milestone and save a career/course. Use Compare and Saved from the bottom bar.
6. Download the career PDF. Use Android's share sheet to save to Files/Drive or share to a trusted app. Open the file: check exactly two pages, readable text, logo, your entered name, page numbers, empty milestone circles, ticked completed circles and completion dates. Print from your PDF viewer if required.
7. Open Updates, check each card has relevant cover artwork, filter categories, save an article and open its official source. Switch offline and verify that the last reading list remains understandable. Refresh after reconnecting.
8. Force-close and reopen the app. Sign in again and confirm your name, assessment, milestone, saved items and theme remain. Sign out, press Back and confirm the workspace cannot reopen until sign-in. Test Android Back in dropdowns, dialogs, report screens and Home.
9. Export a workspace backup, import it on the other device, and compare progress. Test Clear this device's workspace only after retaining that backup.
10. Install a later APK signed with the same key. Confirm that Android updates in place and preserves progress. If testing temporary debug keys, export before uninstalling an incompatible older build.

## Interpreting failures

- Installation blocked or update conflict: verify the downloaded file is an APK, the device meets Android API 24+, and the signing key matches the installed copy.
- AAB will not open: AAB is a Play publishing bundle. Download the APK instead.
- Data missing after uninstall/site change: restore an exported JSON backup; local storage is not cloud sync.
- Updates unchanged: this release bundles twelve curated cards. Update the source edition and rebuild to distribute new cards; no daily feed is connected.
- Actions failure: open the first failed step, fix that cause, then rerun. Do not skip checks merely to publish a build.
