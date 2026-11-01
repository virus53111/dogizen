# Murdilimax Browser — native desktop release gate (2026-11-01)

Status: **pre-release QA**, NOT approval to update the public installers.

## Automated native engine acceptance

Run the dedicated GitHub Actions workflow browser-real-crossplatform.yml on:
- Windows 10/11 x64 runner
- macOS Intel runner
- macOS Apple Silicon runner
- Linux control runner

Checks use only temporary synthetic profile directories, a local loopback
web server and an optional synthetic loopback HTTP proxy, never user sessions
or billing data.

Required checks, all using REAL Camoufox:
1. Launch the actual engine with a native OS fingerprint and navigate to a
   localhost page.
2. Restart the same persistent profile; verify its cookie and baseline
   navigator properties persist; verify a second profile does not inherit
   site cookies.
3. Import a local minimal Firefox extension, see it run in the assigned
   profile, ensure it is absent in the second profile, disable it, and verify
   it no longer runs after restart.
4. Create a synthetic cookie, back up the Firefox SQLite database, clear it,
   and restore it; verify the real browser sees the restored cookie only in
   the original profile.
5. Configure a local HTTP proxy in Murdilimax. Browse a reserved .invalid
   hostname: it MUST be served by the local proxy process. Failure to contact
   the proxy is a test failure, with no fallback to a direct network route.

Additional CI: browser-ci.yml must pass on all three OS families; release
package workflow must produce Windows Preview Setup.exe and Intel/Apple
Silicon Preview DMGs and run packaged --selftest.

## Physical-device acceptance still required — must be checked manually

- [ ] Windows 10/11 x64 clean user account: install Setup.exe, launch the
      application, create 3 profiles, download Camoufox, close/relaunch,
      recover data, then uninstall. Inspect Windows Defender/SmartScreen.
- [ ] macOS Apple Silicon: mount DMG, move the app to Applications, start
      the app, check OS security prompts, test first engine download,
      persistent storage and a full browser restart.
- [ ] macOS Intel: repeat installation, launch and background process tests.
      Do not claim Catalina 10.15 compatibility.
- [ ] Proxy: test an authorized proxy (not a customer credential) and ensure
      its IP appears as expected, then separately examine DNS, IPv6 and
      WebRTC leaks. The local proxy test proves HTTP routing only.
- [ ] Cookies/extensions: test synthetic data, GUI confirmation, crashes and
      restarts. Never share cookies.sqlite backups or real account tokens.
- [ ] Account: pair an actual installed desktop app to a dedicated permitted
      user account using the real email OTP and keychain; verify Free/3 and
      subscription states without initiating an unsolicited charge.
- [ ] Update/rollback: preserve user profile data when reinstalling or
      uninstalling; verify an older installer cannot silently overwrite data.
- [ ] Distribution: record SHA-256 checksums and check trust. Preview Mac
      bundles are ad-hoc signed, **not Apple Developer ID notarized**; do
      not describe them as trusted/notarized release binaries.

## Licensing and sales blockers

The current public beta's child process applies the commercial gate only
when explicitly enabled by MURDILIMAX_REQUIRE_LOGIN=1. Server-side Free/paid
entitlements are tested separately, but GUI limits and local client logic
are not tamper-proof. A paid production launch needs an explicit operator
decision about enforced login, failure/offline behavior and billing rights.
Existing real Stripe payment functions, secrets and customer subscriptions
must remain unchanged during browser QA.

No automatic promotion to public downloads. Promote an installer only after
all relevant physical-device boxes are signed off.
