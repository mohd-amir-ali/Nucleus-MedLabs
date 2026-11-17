# Android signing and installation

Android requires a signing certificate for installable builds. Keep the same release key for future updates. A different certificate normally requires uninstalling the previous application first, which removes its workspace unless exported beforehand.

## GitHub secrets

Under Settings > Secrets and variables > Actions, configure all four:

| Secret | Value |
| --- | --- |
| ANDROID_KEYSTORE_BASE64 | Base64 representation of the private release keystore |
| ANDROID_KEYSTORE_PASSWORD | Keystore password |
| ANDROID_KEY_ALIAS | Key alias |
| ANDROID_KEY_PASSWORD | Key password |

For the locally prepared release, the private signing folder contains `github-signing-secrets.txt`. Open it locally and copy each value into the matching GitHub secret using the website. No Terminal command is needed. This file is not included in the source ZIP.

Never commit the keystore or password file. Keep an independent private backup. GitHub Actions decodes the key into a temporary runner file and removes that file after the build. Build scripts read secret values from environment variables.

With all four secrets configured, the workflow produces a release APK and an AAB. Without signing secrets, it produces a debug preview APK only. Debug signing identities can change across hosted runners; do not use these previews as a stable update channel.

## Install on an Android phone or tablet

1. In your current copy, export the workspace from Settings if you want to keep it.
2. Download the new APK to the Android device.
3. Open the file and allow installation from that browser or file manager when Android requests it.
4. Install and open CareerShift. Enter your name; demonstration credentials are prefilled.
5. If Android reports a certificate conflict, uninstall the earlier preview, install the new APK and import your workspace backup.

Minimum Android version is determined by the generated Capacitor project, currently Android 7 / API 24. Device acceptance testing is still required. An AAB cannot be installed by tapping it; it is an input to Google Play publishing or bundle tooling.
