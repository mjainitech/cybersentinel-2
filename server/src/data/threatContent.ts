import type { ThreatEntry } from "../types";

/**
 * These entries describe real, well-documented, broadly-known
 * categories of threat activity (MFA fatigue attacks, QR-code
 * phishing, ransomware-as-a-service, etc.) — they are curated
 * educational content, not a live feed. There is no single reliable
 * free API for "current phishing trends" the way NVD exists for
 * CVEs, so rather than scrape an unreliable source or invent
 * statistics, this describes real, general threat patterns and cites
 * a genuine public source for further reading on each. Dates reflect
 * when each entry was last reviewed/added to this file, not a claim
 * about when the underlying threat pattern itself began.
 *
 * The live, dynamically-updated part of this feature is the CVE /
 * Vulnerability section, which pulls real-time data from NVD — see
 * services/nvdApiClient.ts.
 */

const REVIEWED_DATE = "2026-08-01";

export const THREAT_ENTRIES: ThreatEntry[] = [
  {
    id: "mfa-fatigue-attacks",
    title: "MFA Fatigue (Push Bombing) Attacks",
    category: "social-engineering",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Attackers who already have a stolen password repeatedly trigger MFA push notifications, hoping the target eventually approves one out of frustration or confusion.",
    fullDescription:
      "MFA fatigue (also called 'push bombing') targets accounts protected by push-notification-based multi-factor authentication. An attacker who has already obtained a valid password floods the victim's phone with repeated login-approval prompts — sometimes at odd hours — hoping the victim will eventually tap 'Approve' just to make the notifications stop, or because they mistake it for a glitch. This tactic doesn't break MFA technically; it exploits the person receiving the prompts.",
    warningSigns: [
      "Receiving multiple unexpected MFA approval requests in a short period.",
      "Login prompts appearing at unusual times, especially overnight.",
      "A prompt for a login you did not initiate.",
    ],
    protectionSteps: [
      "Never approve an MFA prompt you did not just trigger yourself.",
      "If you receive unexpected prompts, treat it as a signal your password may be compromised and change it.",
      "Where available, use number-matching or app-based approval that requires you to enter a code shown on the login screen, rather than a simple tap-to-approve prompt.",
    ],
    source: { name: "CISA — Multi-Factor Authentication", url: "https://www.cisa.gov/MFA" },
    relatedLessonId: "multi-factor-authentication",
    relatedToolHref: { label: "Review Password Security", href: "/dashboard/password-center" },
  },
  {
    id: "qr-code-phishing",
    title: "QR Code Phishing (\"Quishing\")",
    category: "phishing",
    severity: "medium",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Scammers embed malicious links inside QR codes — in emails, flyers, or stickers over real ones — since phones can't easily preview where a QR code leads before scanning.",
    fullDescription:
      "QR code phishing relies on the fact that scanning a QR code often opens a link directly, without the same easy 'hover to preview' step available for a typed link. Attackers distribute malicious QR codes over email (often disguised as a delivery notice or account-verification request), or physically, by placing a sticker over a legitimate QR code (for example, on a parking meter or restaurant menu).",
    warningSigns: [
      "An unsolicited QR code in an email asking you to 'scan to verify' something.",
      "A QR code sticker that looks slightly misaligned or placed over another one.",
      "Urgency paired with a QR code instead of a normal clickable link.",
    ],
    protectionSteps: [
      "Most phone cameras show a link preview before opening it — always check the preview before tapping through.",
      "Be skeptical of unsolicited QR codes, especially ones asking you to log in or enter payment details.",
      "When in doubt, navigate to the organization's site directly instead of scanning.",
    ],
    source: { name: "FTC Consumer Advice — QR Code Scams", url: "https://consumer.ftc.gov/consumer-alerts/2023/09/watch-out-qr-code-scams" },
    relatedLessonId: "what-is-phishing",
    relatedToolHref: { label: "Practice with the Email Phishing Analyzer", href: "/dashboard/email-scanner" },
  },
  {
    id: "business-email-compromise",
    title: "Business Email Compromise (BEC)",
    category: "phishing",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "An attacker impersonates an executive or trusted contact — often via a compromised or lookalike email account — to request an urgent wire transfer or gift card purchase.",
    fullDescription:
      "Business Email Compromise doesn't typically rely on malware at all — it relies on convincing impersonation and a plausible, urgent request, usually related to money or sensitive data. Attackers research who to impersonate (an executive, a vendor, a coworker) and time the request for when verification is inconvenient, like right before a holiday or during travel.",
    warningSigns: [
      "An urgent payment or gift-card request, especially one asking to bypass normal approval steps.",
      "A request that arrives from a slightly altered email address or an unexpected reply-to address.",
      "Pressure to keep the request confidential or act before verifying with anyone else.",
    ],
    protectionSteps: [
      "Verify unusual payment requests through a separate channel — a phone call to a known number, not a reply to the email.",
      "Be suspicious of any request that discourages you from double-checking.",
      "Report suspected BEC attempts to your organization's IT or security team promptly.",
    ],
    source: { name: "FBI IC3 — Business Email Compromise", url: "https://www.ic3.gov/Media/Y2023/PSA230609" },
    relatedLessonId: "what-is-phishing",
    relatedToolHref: { label: "Practice with the Email Phishing Analyzer", href: "/dashboard/email-scanner" },
  },
  {
    id: "ransomware-as-a-service",
    title: "Ransomware-as-a-Service Operations",
    category: "ransomware",
    severity: "critical",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Ransomware groups increasingly rent out their tools and infrastructure to other criminals, lowering the technical skill needed to launch a ransomware attack.",
    fullDescription:
      "Ransomware-as-a-Service (RaaS) is a criminal business model where a ransomware group develops and maintains the actual malicious software and negotiation infrastructure, then leases access to 'affiliates' who carry out attacks in exchange for a cut of any ransom paid. This has broadened who can carry out ransomware attacks, since affiliates don't need to build the ransomware themselves.",
    warningSigns: [
      "Suspicious email attachments or links, which remain the most common initial entry point.",
      "Unpatched, internet-facing systems and remote access tools with weak or reused passwords.",
      "Unusual, large-scale file encryption activity on a network.",
    ],
    protectionSteps: [
      "Keep regular, offline backups of anything you can't afford to lose.",
      "Keep software and operating systems updated with security patches.",
      "Be cautious with email attachments and links, and use MFA on remote access tools.",
    ],
    source: { name: "CISA — StopRansomware", url: "https://www.cisa.gov/stopransomware" },
    relatedLessonId: "ransomware",
  },
  {
    id: "credential-stuffing-trend",
    title: "Automated Credential Stuffing at Scale",
    category: "identity-theft",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Attackers use automated tools to try username/password pairs leaked in past breaches against many other websites, betting on password reuse.",
    fullDescription:
      "Credential stuffing tools can attempt thousands of login combinations per minute across many sites simultaneously, using lists compiled from prior breaches. It's effective purely because of password reuse — the attacker isn't guessing anything, just replaying credentials that already leaked somewhere else.",
    warningSigns: [
      "An unexpected 'new device login' or password-reset notification you didn't request.",
      "Being logged out of an account unexpectedly.",
      "A breach-check tool reporting your email in a database that included exposed passwords.",
    ],
    protectionSteps: [
      "Use a unique password for every account — a password manager makes this realistic.",
      "Enable multi-factor authentication wherever it's offered.",
      "Check your accounts periodically using a breach-checking tool.",
    ],
    source: { name: "CISA — Credential Stuffing", url: "https://www.cisa.gov/news-events/alerts/2023/03/17/cisa-releases-advisory-mitigate-credential-stuffing" },
    relatedLessonId: "data-breaches",
    relatedToolHref: { label: "Check for Data Breaches", href: "/dashboard/breach-checker" },
  },
  {
    id: "typosquatting-lookalike-domains",
    title: "Typosquatting & Lookalike Domains",
    category: "web-security",
    severity: "medium",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Scammers register domains that closely resemble popular brands — a swapped letter, added hyphen, or different ending — to catch people who mistype or scan quickly.",
    fullDescription:
      "Typosquatted and lookalike domains are cheap and easy for attackers to register in bulk, often ahead of predictable events like major sales or tax season. They're commonly used for phishing pages or fake storefronts. Because the visual difference from the real domain can be subtle, these sites rely on people scanning quickly rather than reading carefully.",
    warningSigns: [
      "A URL that's almost, but not exactly, the brand name you expect.",
      "An unusual top-level domain for a well-known brand.",
      "A deal or urgency-driven link shared outside the brand's usual channels.",
    ],
    protectionSteps: [
      "Type known addresses directly or use saved bookmarks rather than following links from ads or messages.",
      "Check a domain's reputation before entering sensitive information.",
      "Look closely at the full domain, not just the beginning of the URL.",
    ],
    source: { name: "CISA — Recognizing and Avoiding Email Scams", url: "https://www.cisa.gov/sites/default/files/publications/RecognizingandAvoidingEmailScams_0905.pdf" },
    relatedLessonId: "website-reputation",
    relatedToolHref: { label: "Try the Website Scanner", href: "/dashboard/url-scanner" },
  },
  {
    id: "sim-swapping",
    title: "SIM Swapping",
    category: "identity-theft",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "An attacker convinces a mobile carrier to transfer a victim's phone number to a SIM card the attacker controls, intercepting calls and SMS-based verification codes.",
    fullDescription:
      "SIM swapping typically starts with the attacker gathering enough personal information about a target (often from social media or prior breaches) to impersonate them to a mobile carrier's support team. Once the number is transferred, the attacker can receive SMS-based one-time passcodes and password-reset texts intended for the real owner.",
    warningSigns: [
      "Your phone suddenly loses service unexpectedly.",
      "You receive an alert that your SIM or account was changed without your action.",
      "You're locked out of accounts that use SMS-based recovery.",
    ],
    protectionSteps: [
      "Prefer an authenticator app over SMS for multi-factor authentication where possible.",
      "Set up a PIN or extra verification step with your mobile carrier for account changes.",
      "Limit how much personal information you share publicly, since it's often used to impersonate you.",
    ],
    source: { name: "FCC — SIM Swapping and Port-Out Fraud", url: "https://www.fcc.gov/sim-swapping-and-port-out-fraud" },
    relatedLessonId: "multi-factor-authentication",
    relatedToolHref: { label: "Review Password Security", href: "/dashboard/password-center" },
  },
  {
    id: "fake-delivery-smishing",
    title: "Fake Delivery Notification Smishing",
    category: "phishing",
    severity: "medium",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Text messages impersonating a shipping carrier claim a package couldn't be delivered and ask you to click a link and pay a small fee or 'confirm your address.'",
    fullDescription:
      "This is one of the most common smishing (SMS phishing) patterns precisely because it works whether or not you're actually expecting a package — enough recipients are, at any given time, that a mass campaign reliably finds targets. The link usually leads to a fake payment or login page designed to capture card details or credentials.",
    warningSigns: [
      "An unexpected text about a delivery problem with a link to click.",
      "A request for a small payment to 'redeliver' a package.",
      "A shortened or unfamiliar link you can't preview.",
    ],
    protectionSteps: [
      "Don't click the link — check directly with the carrier's official app or website instead.",
      "Real carriers generally don't ask for payment by text to redeliver a package.",
      "Report and delete suspicious delivery texts.",
    ],
    source: { name: "USPS — Text Message Scams", url: "https://www.uspis.gov/news/scam-article/smishing" },
    relatedLessonId: "recognizing-suspicious-messages",
    relatedToolHref: { label: "Practice with the Email Phishing Analyzer", href: "/dashboard/email-scanner" },
  },
  {
    id: "info-stealer-malware",
    title: "Information-Stealing Malware (\"Stealers\")",
    category: "malware",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "A category of malware focused specifically on harvesting saved passwords, browser cookies, and cryptocurrency wallet data, often spread through cracked software or fake downloads.",
    fullDescription:
      "Information-stealing malware ('stealers') is often distributed through pirated software, fake game cheats, or cracked design/productivity tools advertised on forums and video platforms. Once run, it scans the infected device for saved browser credentials, session cookies, and other valuable data, then sends it back to the attacker — frequently without any other visible symptoms.",
    warningSigns: [
      "Downloading software from unofficial sources, especially 'cracked' or 'free' versions of paid tools.",
      "Being asked to disable antivirus software to run a downloaded program.",
      "Unexpected logins or password-reset alerts after installing new software.",
    ],
    protectionSteps: [
      "Only download software from official sources or well-established app stores.",
      "Keep an updated, reputable antivirus/anti-malware tool active.",
      "If you suspect infection, change your passwords from a separate, trusted device.",
    ],
    source: { name: "CISA — Guidance on Malware", url: "https://www.cisa.gov/topics/cyber-threats-and-advisories/malware-phishing-and-ransomware" },
    relatedLessonId: "what-is-malware",
  },
  {
    id: "deepfake-social-engineering",
    title: "AI-Generated Voice and Video Impersonation",
    category: "social-engineering",
    severity: "medium",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Increasingly accessible AI tools can clone a voice or likeness from short samples, adding a new layer of realism to impersonation scams like fake emergency calls from 'family members.'",
    fullDescription:
      "This trend builds on classic impersonation social engineering, but with AI-generated audio or video making the impersonation more convincing than a simple phone call. Common scenarios include a cloned voice claiming to be a family member in an emergency needing money urgently, or a fabricated video call appearing to be a company executive authorizing a transaction.",
    warningSigns: [
      "An urgent request for money or sensitive information from someone claiming to be a known contact, especially over an unusual channel.",
      "Pressure to act immediately without verifying independently.",
      "Audio or video that feels slightly off in timing, tone, or detail despite sounding familiar.",
    ],
    protectionSteps: [
      "Establish a verification method with close family (like an agreed-upon code word) for emergency requests.",
      "Always verify unusual requests through a separate, known channel before acting.",
      "Be cautious about how much voice/video content of yourself is publicly available online.",
    ],
    source: { name: "FBI — Public Service Announcement on AI Voice Cloning", url: "https://www.ic3.gov/Media/Y2023/PSA230505" },
    relatedLessonId: "social-engineering",
  },
  {
    id: "software-supply-chain-attacks",
    title: "Software Supply Chain Attacks",
    category: "vulnerabilities",
    severity: "high",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Attackers compromise a trusted software vendor, open-source package, or update mechanism, so malicious code reaches many downstream users through what looks like a routine update.",
    fullDescription:
      "Rather than attacking a target directly, a supply chain attack compromises something the target already trusts — a widely used software library, a vendor's update server, or a build pipeline. Because the malicious code arrives disguised as a normal, expected update, it can be especially hard to detect until real damage is already underway.",
    warningSigns: [
      "This category of attack is largely invisible to individual end users until publicly disclosed.",
      "Security advisories from vendors about a compromised update or package.",
      "Unexpected new permissions or behavior requested by a recently updated app.",
    ],
    protectionSteps: [
      "Keep software updated, since vendors typically patch quickly once a compromise is discovered.",
      "Follow official security advisories for software you rely on.",
      "For organizations: maintain awareness of your software supply chain and monitor vendor security bulletins.",
    ],
    source: { name: "CISA — Software Supply Chain Security", url: "https://www.cisa.gov/resources-tools/resources/software-supply-chain-security-guidance" },
    relatedLessonId: "owasp-top-10",
  },
  {
    id: "data-breach-notification-trend",
    title: "Rising Volume of Data Breach Notifications",
    category: "data-breaches",
    severity: "medium",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Organizations of all sizes continue to disclose breaches affecting customer data, often stemming from phishing, credential theft, or unpatched systems rather than sophisticated novel attacks.",
    fullDescription:
      "Most disclosed data breaches trace back to a small number of recurring root causes: successful phishing against an employee, stolen or reused credentials, and unpatched, internet-facing systems. Very few involve a genuinely novel technique — the pattern matters more than any single incident.",
    warningSigns: [
      "A notification email from a company you have an account with, referencing a breach.",
      "Your email appearing in a breach-check tool's results.",
      "Password-reset emails you didn't request.",
    ],
    protectionSteps: [
      "Check whether your email appears in known breaches periodically.",
      "Change any password reported as exposed, and anywhere you reused it.",
      "Enable MFA so a leaked password alone isn't enough to compromise an account.",
    ],
    source: { name: "CISA — Cyber Threats and Advisories", url: "https://www.cisa.gov/topics/cyber-threats-and-advisories" },
    relatedLessonId: "data-breaches",
    relatedToolHref: { label: "Check for Data Breaches", href: "/dashboard/breach-checker" },
  },
  {
    id: "oversharing-on-social-media",
    title: "Oversharing Personal Details on Social Media",
    category: "identity-theft",
    severity: "low",
    publishedDate: REVIEWED_DATE,
    lastUpdatedDate: REVIEWED_DATE,
    shortDescription: "Publicly shared details like a birth date, pet names, or hometown are frequently the same information used for account-recovery security questions or password guesses.",
    fullDescription:
      "Attackers researching a specific target often start with public social media profiles, since many people unintentionally publish the exact details used elsewhere for identity verification — a birth date, a first pet's name, a mother's maiden name shared in a nostalgic post. Combined, small public details can add up to a meaningful identity-theft risk.",
    warningSigns: [
      "Security questions on your accounts that could be answered using your public social media posts.",
      "Sharing your location in real time rather than after the fact.",
      "Publicly listing detailed personal milestones (full birth date, workplace, home address).",
    ],
    protectionSteps: [
      "Review your social media privacy settings periodically.",
      "Avoid using publicly-guessable facts as security-question answers or passwords.",
      "Consider what a stranger could learn about you from your public profile alone.",
    ],
    source: { name: "FTC — Protecting Your Identity", url: "https://consumer.ftc.gov/features/identity-theft" },
    relatedLessonId: "personally-identifiable-information",
    relatedToolHref: { label: "Review the Privacy Learning Path", href: "/dashboard/learning-hub" },
  },
];
