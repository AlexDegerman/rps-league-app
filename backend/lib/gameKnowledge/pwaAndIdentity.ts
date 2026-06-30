export const pwaAndIdentity = `
SYSTEM DEFINITIONS: PWA INSTALLATION, ONBOARDING, AND IDENTITY SYSTEMS

--- INSTALLING THE APP (PWA) ---

Q: Can I install RPS League as an app on my phone or computer?
A: Yes. RPS League is a Progressive Web App (PWA) and can be installed directly from your browser for an app-like experience with its own icon and window, no app store required.

Q: How do I install it on Android (Chrome)?
A: Open the site in Chrome, tap the three-dot menu in the top right, and select "Install app" or "Add to Home screen." A confirmation prompt will appear; tap Install. The icon will then appear on your home screen and launches in its own standalone window without browser tabs or address bars.

Q: How do I install it on iPhone or iPad (Safari)?
A: Open the site in Safari, tap the Share icon at the bottom of the screen, scroll down and select "Add to Home Screen," then tap Add. Safari is required for this option; other iOS browsers like Chrome on iOS do not support installing PWAs to the home screen.

Q: How do I install it on desktop (Chrome, Edge, or other Chromium browsers)?
A: Look for an install icon in the address bar, usually shaped like a small monitor with a downward arrow, on the right side of the URL field. Click it and confirm "Install" in the popup. The app will then open in its own dedicated window and can be launched from your desktop, taskbar, or start menu like a native application.

Q: What do I get from installing the PWA versus just using it in a browser tab?
A: The installed app launches in its own standalone window without browser chrome (no tabs, address bar, or browser UI), gets its own home screen or desktop icon, and feels more like a native application. The underlying gameplay, data, and your local identity are identical either way since it is the same web app.

Q: Does installing the app require an account or registration?
A: No. Installing the PWA does not require any sign-up. Your identity is already stored locally in your browser before and after installation, using the same zero-friction system described in the Identity FAQ.

Q: Will my progress carry over if I install the app after already playing in browser?
A: Yes, as long as you install it from the same browser and device where you have been playing. The PWA reads from the same local browser storage. If you want to guarantee continuity across devices or after clearing data, use your recovery code to restore your profile inside the installed app.

--- WELCOME MODAL AND FIRST-TIME ONBOARDING ---

Q: What happens the very first time I visit the site?
A: First-time visitors are greeted with an interactive Welcome Modal that introduces the virtual point economy and lets you "Reroll" your randomly generated nickname before your first match. This establishes your identity before you place your first bet.

Q: What is the Guided Recovery Onboarding?
A: The first time you visit your profile page, a one-time, server-tracked tutorial triggers using a dynamic spotlight overlay and auto-scroll logic. It guides your attention directly to your recovery code and explains why saving it matters, helping prevent permanent data loss before you navigate away.

Q: Will the recovery code tutorial show up again after I have seen it once?
A: No. The tutorial is server-persisted as acknowledged after your first profile visit and will not reappear on later visits, even across sessions, as long as your profile identity remains intact.

--- WHAT'S NEW AND UPDATE LOG ---

Q: How do I know what changed in a recent update?
A: Returning players are shown a contextual "What's New" overlay automatically when a new release has shipped since their last visit. This is tracked client-side via a lightweight version acknowledgment system stored in your browser, so it only ever surfaces once per deployed version.

Q: Where can I read the full history of updates and features?
A: There is a dedicated in-app Update History page documenting every major gameplay system, live-service feature, infrastructure upgrade, and seasonal content rollout since launch.

Q: If I clear my browser data, will I see every past "What's New" overlay again?
A: You will see the overlay for the current version again since the local acknowledgment record is stored in the same browser storage that gets cleared. This does not affect your point balance or progression data if you have a recovery code, but the version tracking itself is separate from your account identity.

--- PUBLIC PROFILES AND SHARING ---

Q: Can other people view my profile without an account?
A: Yes. Every Predictor has a unique public profile URL that can be viewed by anyone, including people who have never played the game. No account or login is required to view a shared profile.

Q: What does a shared public profile show?
A: A public profile displays your 16 tracked data points, your curated badge showcase, your equipped relic, your optional LinkedIn verification badge, and a context-aware match history with Recent, Biggest Wins, and Best Multipliers tabs.

--- DEVICE AND BROWSER COMPATIBILITY ---

Q: What devices and browsers are supported?
A: Modern mobile and desktop browsers are supported, including iOS 14 and above, Android 9 and above, and current versions of Chrome, Firefox, and Safari.

Q: What devices are NOT supported?
A: Older browsers and devices without native BigInt support are not supported, including Internet Explorer and early iPhone models such as the iPhone 6 and 7. This is because the application relies on BigInt arithmetic to handle extreme point values without precision loss.

--- THE NUMBER FORMATTING ENGINE ---

Q: Why do my points display differently as I progress (M, B, T, Sx, Vg)?
A: All numbers in the game flow through a single custom BigInt-first formatting engine that converts raw point values into tiered human-readable labels such as Millions (M), Billions (B), Trillions (T), Sextillions (Sx), and on into Vigintillions and beyond. This engine also maps numeric ranges to the visual tier styles and gradients you see on your balance.

Q: Why does this matter for accuracy at high point values?
A: Because every visible number, including leaderboards, profiles, the live feed, and bonus payouts, flows through the same engine, your displayed balance always matches your actual stored balance exactly, even at extreme scales like vigintillions, with zero precision loss or rounding drift.

--- MOCK MATCH GENERATION ---

Q: Are these real Rock Paper Scissors tournaments happening somewhere?
A: No. Matches are generated by a self-contained internal match generator running entirely within the application. There is no external tournament, live event, or third-party data feed being consumed; all match outcomes are produced locally by the system's own bot logic.
`
