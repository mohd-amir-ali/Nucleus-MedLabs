# Publish CareerShift with GitHub Desktop

## Repository details

- Name: `Nucleus-MedLabs-CareerShift`
- Description: `A responsive healthcare career planning platform with skill mapping, pathway comparisons, learning roadmaps, and Android access.`
- Owner: `mohd-amir-ali`
- Website: `https://mohd-amir-ali.github.io/Nucleus-MedLabs-CareerShift/`
- Topics: `medtech`, `healthcare-careers`, `career-planning`, `clinical-research`, `pharmacovigilance`, `pwa`, `capacitor`, `android`

## Prepare your identity

In GitHub Desktop settings, connect your GitHub account. Under Git, use author name **Mohd Amir Ali** and an email verified on that account, or the exact private noreply email GitHub provides. This associates new commits with your profile. Do not guess the email address.

## Create and publish

1. Choose File > Add local repository and select the cleaned project folder.
2. If it is not a repository yet, follow the prompt to create a repository there. Confirm the resulting local path is the existing folder, not a second nested folder.
3. Review Changes. No signing keys, databases, `node_modules`, generated Android project or release binaries should appear.
4. Commit related changes using meaningful messages. GitHub Desktop permits selecting the files included in each commit. Do not backdate or create empty commits to imitate history.
5. Choose Publish repository. Use the name above. A public repository supports public Pages and direct release downloads.
6. On GitHub, add the description, website and topics through the repository About settings.

Suggested logical commit groups, where those files actually changed:

- `build: configure reproducible web and Android builds`
- `feat(assets): add CareerShift branding and responsive imagery`
- `feat(careers): add career catalogue and transparent readiness scoring`
- `feat(ui): add adaptive career planning workspace`
- `feat(planning): add skills, comparisons and PDF career plans`
- `test: cover workspace persistence and cross-platform journeys`
- `ci: automate Pages deployment and Android release builds`
- `docs: document product boundaries and publication workflow`

## Enable the web platform

Open Settings > Pages > Build and deployment > Source, then select **GitHub Actions**. Open Actions > Deploy web app and run it on `main` if the first push happened before Pages was enabled. The deployment URL is shown on the successful run.

`index.html` is the website entry. It presents `app.html` inside a viewport that can switch between Website, Tablet and Smartphone modes. The same app is bundled directly as Android's entry point.

## Build and publish Android downloads

1. Configure signing as described in ANDROID_SIGNING.md. This is necessary for stable release APK and AAB builds.
2. Open Actions > Build Android app > Run workflow.
3. Choose `main`, enable **Publish the version in package.json as a downloadable GitHub Release**, and run.
4. Wait for checks, build and release jobs to finish.
5. Open Releases. The assets contain the APK, AAB when signing is configured, and checksums.

Users open the release URL, expand Assets and download the APK. They do not need Terminal, Android Studio or GitHub Actions access for a public release download. The AAB is for a future Play Console submission.

The README APK button leads to the latest release. Keep it as a release link rather than a temporary Actions artifact link. Actions artifacts are useful for internal testing and expire after their configured retention period.

## Future updates

Change the version in package.json and package-lock.json together and update the service-worker cache version. Commit and push through GitHub Desktop. Publish a new matching version release after testing. Reuse the signing key so the new APK can update the previous release.

The twelve-card reading edition is bundled. Updating it requires a web deployment and a new APK for installed Android copies; there is no automatic live feed in this release.
