import type { Lesson, LearningCategory, LearningCategoryId } from "../types";

/**
 * This is the entire lesson content library. It's a static, typed
 * module rather than a database table because lesson content is
 * curated, versioned with the codebase, and publicly readable — there's
 * no user-generated content here to justify a mutable store. Adding a
 * new lesson later means adding one object to LESSONS below; nothing
 * else in the Learning Hub needs to change.
 *
 * SCOPE NOTE: every lesson listed in the spec exists here with full
 * metadata (category, order, difficulty), so the learning path always
 * shows the complete intended structure. 14 lessons (two per category)
 * have full, real content and a working quiz. The remaining lessons
 * have `isAvailable: false` and are shown as "Coming Soon" in the UI
 * rather than either being left out of the path or shipped as
 * shallow, low-quality stubs.
 */

const STUB_SCENARIO = {
  prompt: "This lesson's scenario hasn't been written yet.",
  options: ["Check back soon"],
  safestOptionIndex: 0,
  guidance: "This lesson is coming soon.",
};

function stub(
  id: string,
  categoryId: LearningCategoryId,
  title: string,
  order: number,
  difficulty: Lesson["difficulty"] = "beginner"
): Lesson {
  return {
    id,
    categoryId,
    title,
    difficulty,
    estimatedMinutes: 5,
    order,
    objectives: ["This lesson is coming soon."],
    explanation: "This lesson hasn't been written yet — check back soon as the Learning Hub grows.",
    examples: [],
    keyTerms: [],
    whyThisMatters: "Coming soon.",
    scenario: STUB_SCENARIO,
    quiz: [],
    isAvailable: false,
  };
}

export const LEARNING_CATEGORIES: Omit<LearningCategory, "lessonCount" | "availableLessonCount">[] = [
  { id: "fundamentals", title: "Cybersecurity Fundamentals", description: "The core concepts everything else in security builds on." },
  { id: "online-safety", title: "Online Safety", description: "Practical habits that protect your accounts day to day." },
  { id: "phishing-social-engineering", title: "Phishing & Social Engineering", description: "How attackers manipulate people rather than systems." },
  { id: "web-security", title: "Web Security", description: "What actually happens between your browser and a website." },
  { id: "malware", title: "Malware", description: "The different kinds of malicious software, and how to avoid them." },
  { id: "privacy", title: "Privacy", description: "Understanding and controlling what you share online." },
  { id: "application-security", title: "Application Security", description: "How software gets built securely — at a conceptual level." },
];

export const LESSONS: Lesson[] = [
  {
    id: "what-is-cybersecurity",
    categoryId: "fundamentals",
    title: "What Is Cybersecurity?",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Define cybersecurity in plain language.",
      "Understand what cybersecurity is trying to protect.",
      "Recognize that cybersecurity is about people and processes, not just technology.",
    ],
    explanation:
      "Cybersecurity is the practice of protecting devices, networks, accounts, and data from unauthorized access, damage, or theft. It's easy to picture cybersecurity as purely technical — firewalls, encryption, antivirus software — but a huge part of it is human: the choices people make about passwords, links, and what they share. Most real-world security incidents involve someone being tricked, not a system being broken into with advanced tools.",
    examples: [
      "Locking your phone with a passcode is a basic cybersecurity control.",
      "A company training employees to recognize phishing emails is a cybersecurity practice, even though it involves no code.",
      "Using a unique password for your email account protects it even if another site you use gets breached.",
    ],
    keyTerms: [
      {
        term: "Attack",
        simpleExplanation: "An attempt by someone to access, damage, or steal something without permission.",
        example: "Someone trying thousands of common passwords against your email account.",
        learnMore:
          "Attacks range enormously in sophistication — from a stranger guessing a weak password, to automated tools trying millions of combinations, to targeted efforts against a specific person or organization.",
      },
      {
        term: "Defense in depth",
        simpleExplanation: "Using multiple layers of protection so that if one fails, others still help.",
        example: "A strong password AND multi-factor authentication on the same account.",
        learnMore:
          "No single security measure is perfect. Defense in depth means that even if an attacker gets past one layer (like guessing a password), other layers (like MFA) can still stop them.",
      },
    ],
    whyThisMatters:
      "Understanding that cybersecurity is about people as much as technology changes how you think about your own habits. You don't need to be a programmer to meaningfully improve your security — most of what matters is decisions you already have full control over.",
    scenario: {
      prompt: "A friend tells you cybersecurity is 'only something IT departments need to worry about.' What's the most accurate response?",
      options: [
        "They're right — regular people can't really affect their own security.",
        "Everyone makes security-relevant decisions every day, like what links to click and whether to reuse passwords.",
        "Cybersecurity is only about installing antivirus software.",
        "Cybersecurity doesn't matter unless you work in tech.",
      ],
      safestOptionIndex: 1,
      guidance:
        "Everyone who uses email, social media, or online banking makes security decisions constantly — clicking links, choosing passwords, deciding what to share. Cybersecurity awareness benefits everyone, not just IT professionals.",
    },
    quiz: [
      {
        id: "q1",
        question: "Which of these is the best description of cybersecurity?",
        choices: [
          { text: "Only installing antivirus software", isCorrect: false, explanation: "Antivirus software is one tool, but it's only a small part of a much broader practice." },
          { text: "Protecting devices, networks, accounts, and data from unauthorized access or harm", isCorrect: true, explanation: "This captures the full scope — cybersecurity covers technology, processes, and people." },
          { text: "A job only IT professionals need to think about", isCorrect: false, explanation: "Everyone who uses digital accounts makes security-relevant decisions regularly." },
          { text: "Writing code that can't be hacked", isCorrect: false, explanation: "No system is unhackable — cybersecurity is about reducing risk, not achieving a perfect, unbreakable state." },
        ],
      },
      {
        id: "q2",
        question: "Why does 'defense in depth' matter?",
        choices: [
          { text: "It guarantees you'll never be hacked", isCorrect: false, explanation: "No approach guarantees complete safety — the goal is reducing risk, not eliminating it entirely." },
          { text: "It means you only need one strong password", isCorrect: false, explanation: "Defense in depth is about having multiple layers, not relying on just one — even a strong one." },
          { text: "If one layer of protection fails, other layers can still help protect you", isCorrect: true, explanation: "That's exactly it — layering protections means a single mistake or failure doesn't have to be catastrophic." },
          { text: "It's a term for antivirus software", isCorrect: false, explanation: "It's a general security principle, not a specific product or tool." },
        ],
      },
    ],
    isAvailable: true,
  },
  {
    id: "cia-triad",
    categoryId: "fundamentals",
    title: "The CIA Triad",
    difficulty: "beginner",
    estimatedMinutes: 7,
    order: 2,
    objectives: [
      "Define Confidentiality, Integrity, and Availability.",
      "Give a real-world example of each.",
      "Understand why security decisions often involve trade-offs between the three.",
    ],
    explanation:
      "The CIA Triad is one of the most foundational models in cybersecurity — it describes the three goals almost every security decision is trying to protect. Confidentiality means only authorized people can see information. Integrity means information is accurate and hasn't been tampered with. Availability means information and systems are accessible to the people who legitimately need them, when they need them. Nothing to do with the intelligence agency — it's just a shared acronym.",
    examples: [
      "Confidentiality: encrypting a message so only the intended recipient can read it.",
      "Integrity: a bank verifying that a transaction amount wasn't altered in transit.",
      "Availability: a hospital's patient record system staying online during an emergency.",
    ],
    keyTerms: [
      {
        term: "Confidentiality",
        simpleExplanation: "Keeping information visible only to the people who are supposed to see it.",
        example: "Your medical records being visible only to you and your doctor.",
        learnMore:
          "Confidentiality is usually protected through encryption, access controls, and authentication — making sure only the right people (or systems) can view sensitive data.",
      },
      {
        term: "Integrity",
        simpleExplanation: "Making sure information stays accurate and hasn't been changed without authorization.",
        example: "Making sure nobody can secretly edit your grade after a teacher submits it.",
        learnMore:
          "Integrity failures can be just as damaging as confidentiality breaches — even if no one *saw* stolen data, tampered data (like an altered financial record) can cause real harm.",
      },
      {
        term: "Availability",
        simpleExplanation: "Making sure systems and information are accessible when legitimately needed.",
        example: "A website staying online during a big sale instead of crashing from too much traffic.",
        learnMore:
          "Attacks that intentionally overwhelm a system (like a denial-of-service attack) target availability specifically — the goal is to make a service unusable, not necessarily to steal anything.",
      },
    ],
    whyThisMatters:
      "The CIA Triad gives you a simple mental checklist for evaluating any security question: what am I protecting, and is it confidentiality, integrity, availability — or some combination? This framing shows up throughout the rest of this Learning Hub.",
    scenario: {
      prompt:
        "A company adds so many password and security checks to its internal system that employees can barely log in and get their work done. Which part of the CIA Triad is most directly harmed?",
      options: ["Confidentiality", "Integrity", "Availability", "None of these — security has no trade-offs"],
      safestOptionIndex: 2,
      guidance:
        "Availability is harmed when legitimate users can't access what they need. Good security balances protection with usability — security that's so strict it stops people from doing their jobs isn't actually working well.",
    },
    quiz: [
      {
        id: "q1",
        question: "What does 'Integrity' mean in the CIA Triad?",
        choices: [
          { text: "Only authorized people can view the data", isCorrect: false, explanation: "That describes Confidentiality, not Integrity." },
          { text: "The data is accurate and hasn't been tampered with", isCorrect: true, explanation: "Exactly — Integrity is about trustworthiness and accuracy of data, not who can see it." },
          { text: "The system never goes offline", isCorrect: false, explanation: "That describes Availability." },
          { text: "The data is encrypted", isCorrect: false, explanation: "Encryption is a tool that supports confidentiality; it doesn't define Integrity by itself." },
        ],
      },
      {
        id: "q2",
        question: "A hospital's scheduling system crashes during a busy shift. Which CIA principle is most directly affected?",
        choices: [
          { text: "Confidentiality", isCorrect: false, explanation: "No data was exposed to unauthorized people here — this isn't a confidentiality issue." },
          { text: "Integrity", isCorrect: false, explanation: "The data itself wasn't changed or corrupted — the system just became unreachable." },
          { text: "Availability", isCorrect: true, explanation: "Correct — the system being unusable when legitimately needed is exactly what Availability protects against." },
          { text: "Authentication", isCorrect: false, explanation: "Authentication isn't one of the three CIA Triad principles." },
        ],
      },
    ],
    isAvailable: true,
  },
  stub("threats-vs-vulnerabilities", "fundamentals", "Threats vs Vulnerabilities", 3),
  stub("risk", "fundamentals", "Risk", 4),
  stub("attack-surface", "fundamentals", "Attack Surface", 5),
  {
    id: "strong-passwords",
    categoryId: "online-safety",
    title: "Strong Passwords",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Identify what makes a password strong versus weak.",
      "Understand why length matters more than complexity tricks.",
      "Know where to check your own passwords for weaknesses.",
    ],
    explanation:
      "A strong password is long, unpredictable, and unique to one account. Length matters more than almost anything else — every extra character multiplies the number of possibilities an attacker's tool would need to try. Predictable patterns (a single dictionary word, a keyboard row like 'qwerty', a birthday) get tried first by automated tools regardless of how 'complex' they look to a human.",
    examples: [
      "\"correct-horse-battery-staple\" style passphrases are long and hard to guess, and easier to remember than random characters.",
      "\"P@ssw0rd1\" looks complex but is actually a well-known, easily-guessed pattern.",
      "A password manager generating a random 20-character password for every account you have.",
    ],
    keyTerms: [
      {
        term: "Entropy",
        simpleExplanation: "A rough measure of how unpredictable a password is.",
        example: "A completely random string of characters has higher entropy than a real word, even if they're the same length.",
        learnMore:
          "Entropy is usually estimated by combining a password's length with how many different types of characters it uses. It's a helpful estimate, not a perfect guarantee.",
      },
      {
        term: "Brute-force attack",
        simpleExplanation: "An automated attempt to guess a password by trying enormous numbers of combinations.",
        example: "A tool trying every 4-digit PIN combination in sequence.",
        learnMore:
          "Modern hardware can try billions of guesses quickly against weakly-protected password data. Length and true randomness are the main defenses.",
      },
    ],
    whyThisMatters:
      "Your password is often the only thing standing between an attacker and your account. CyberSentinel's own Password Security Center will actually analyze a password's real strength for you — this lesson is the 'why' behind what that tool checks.",
    scenario: {
      prompt: "You need a new password for an important account. Which approach is safest?",
      options: [
        "Use your pet's name plus your birth year",
        "Use a long, random passphrase or a password generated by a password manager",
        "Reuse your email password so it's easy to remember",
        "Use \"Password123!\" since it has a symbol and a number",
      ],
      safestOptionIndex: 1,
      guidance:
        "A long, random passphrase (or a generator-produced password) resists both guessing and automated cracking far better than anything based on personal facts or common patterns — even ones that look complex.",
    },
    quiz: [
      {
        id: "q1",
        question: "What matters most for password strength?",
        choices: [
          { text: "Using at least one capital letter", isCorrect: false, explanation: "Helpful, but far less impactful than overall length." },
          { text: "Length and true randomness", isCorrect: true, explanation: "Correct — longer, more unpredictable passwords are dramatically harder to guess or crack." },
          { text: "Changing your password every single day", isCorrect: false, explanation: "Frequent forced changes often lead to weaker, more predictable passwords." },
          { text: "Basing it on a memorable personal fact", isCorrect: false, explanation: "Personal facts are often guessable or discoverable, especially from social media." },
        ],
      },
      {
        id: "q2",
        question: "Why is \"P@ssw0rd1\" considered weak despite having a symbol and a number?",
        choices: [
          { text: "It's too short to type", isCorrect: false, explanation: "Length isn't the specific problem here — predictability is." },
          { text: "It follows an extremely common, well-known substitution pattern attackers check for first", isCorrect: true, explanation: "Exactly — swapping letters for similar-looking symbols is a very well-known trick." },
          { text: "It doesn't have any numbers", isCorrect: false, explanation: "It does contain a number — that's not the issue." },
          { text: "Passwords with symbols are always weak", isCorrect: false, explanation: "Symbols can help — the specific predictable pattern here is the actual weakness." },
        ],
      },
    ],
    relatedTool: { label: "Try the Password Security Center", href: "/dashboard/password-center" },
    isAvailable: true,
  },
  stub("password-reuse", "online-safety", "Password Reuse", 2),
  {
    id: "multi-factor-authentication",
    categoryId: "online-safety",
    title: "Multi-Factor Authentication",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 3,
    objectives: [
      "Define multi-factor authentication (MFA) in plain language.",
      "Identify the three general categories of authentication factors.",
      "Understand why MFA still helps even if a password is stolen.",
    ],
    explanation:
      "Multi-factor authentication means proving who you are using more than one type of evidence before you're allowed to log in. Authentication factors generally fall into three categories: something you know (a password), something you have (your phone, a hardware key), and something you are (a fingerprint or face scan). MFA typically combines a password with one of the other two — so even if your password leaks, an attacker still can't get in without also having your phone or fingerprint.",
    examples: [
      "Entering your password, then approving a push notification on your phone.",
      "Typing a 6-digit code from an authenticator app after your password.",
      "Using your fingerprint to unlock a password manager that then fills in a saved password.",
    ],
    keyTerms: [
      {
        term: "Authentication factor",
        simpleExplanation: "One type of evidence used to prove your identity when logging in.",
        example: "A password is one factor; a fingerprint is a different factor.",
        learnMore:
          "Using two factors from the SAME category (like two passwords) isn't true multi-factor authentication — real MFA combines different categories of evidence.",
      },
      {
        term: "Authenticator app",
        simpleExplanation: "An app that generates a short-lived code used as a second login factor.",
        example: "Opening an app on your phone to get a 6-digit code that changes every 30 seconds.",
        learnMore:
          "Authenticator apps are generally considered more secure than receiving codes by text message, since text messages can sometimes be intercepted through a SIM-swapping attack.",
      },
    ],
    whyThisMatters:
      "Passwords leak — through breaches, phishing, or reuse — far more often than most people realize. MFA is one of the single most effective things you can do to protect an account.",
    scenario: {
      prompt: "Your email provider offers to enable MFA using an authenticator app. What's the safest choice?",
      options: [
        "Skip it — a strong password is already enough.",
        "Enable it — it adds meaningful protection even if your password is ever exposed.",
        "Only enable it after you've already been hacked once.",
        "Enable it, but then never actually download the authenticator app.",
      ],
      safestOptionIndex: 1,
      guidance:
        "MFA is worth enabling proactively, not just reactively. It costs a small amount of convenience for a large increase in protection.",
    },
    quiz: [
      {
        id: "q1",
        question: "Which of these is an example of a second authentication factor, alongside a password?",
        choices: [
          { text: "A second, different password", isCorrect: false, explanation: "Two passwords are still the same type of factor — not true multi-factor." },
          { text: "A code from an authenticator app on your phone", isCorrect: true, explanation: "Correct — this is 'something you have,' a different category from a password." },
          { text: "Writing your password down twice", isCorrect: false, explanation: "This doesn't add a new type of evidence at all." },
          { text: "Choosing a longer password", isCorrect: false, explanation: "A longer password is still just one factor — something you know." },
        ],
      },
      {
        id: "q2",
        question: "Why does MFA still help if your password gets leaked in a data breach?",
        choices: [
          { text: "MFA automatically changes your password for you", isCorrect: false, explanation: "MFA doesn't change passwords — it adds an additional required step to log in." },
          { text: "An attacker with just the leaked password still can't complete the second required step", isCorrect: true, explanation: "Exactly — without your phone, key, or biometric, the leaked password alone isn't enough." },
          { text: "It makes your password impossible to leak in the first place", isCorrect: false, explanation: "MFA doesn't prevent a breach — it limits what an attacker can do afterward." },
          { text: "It only works if you also change your password immediately", isCorrect: false, explanation: "MFA provides protection independent of whether you've changed your password yet." },
        ],
      },
    ],
    relatedTool: { label: "Try the Password Security Center", href: "/dashboard/password-center" },
    isAvailable: true,
  },
  stub("password-managers", "online-safety", "Password Managers", 4),
  stub("credential-stuffing", "online-safety", "Credential Stuffing", 5),
  {
    id: "what-is-phishing",
    categoryId: "phishing-social-engineering",
    title: "What Is Phishing?",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Define phishing and explain its general goal.",
      "Recognize common phishing tactics.",
      "Understand why phishing is so common as an attack method.",
    ],
    explanation:
      "Phishing is an attempt to trick someone into giving up sensitive information — like a password or payment details — usually by impersonating a trustworthy sender. Phishing is popular with attackers precisely because it doesn't require breaking any technical security at all; it targets human trust and urgency instead.",
    examples: [
      "An email claiming to be from your bank, asking you to 'verify your account' by clicking a link.",
      "A message pretending to be from a coworker, asking you to urgently buy gift cards.",
      "A fake login page that looks identical to a real one, designed to capture your password.",
    ],
    keyTerms: [
      {
        term: "Phishing",
        simpleExplanation: "A scam that tries to trick you into giving up sensitive information by pretending to be someone trustworthy.",
        example: "A fake 'password reset' email that actually leads to a fake login page.",
        learnMore:
          "Phishing can happen over email, text message, phone calls, or social media — the medium varies, but the underlying tactic stays the same.",
      },
      {
        term: "Spoofing",
        simpleExplanation: "Disguising a message's real origin to make it look like it came from someone else.",
        example: "An email that displays 'PayPal' as the sender name, but was actually sent from an unrelated address.",
        learnMore:
          "Spoofing can apply to email sender names, phone caller ID, and website domains that look nearly identical to a real one.",
      },
    ],
    whyThisMatters:
      "Phishing remains one of the most common ways accounts actually get compromised. Recognizing the pattern matters more than trying to spot every individual fake message.",
    scenario: {
      prompt:
        "You get an email that says your account will be permanently deleted in 1 hour unless you click a link and log in immediately. What's the safest response?",
      options: [
        "Click the link immediately since time is short.",
        "Don't click the link — go to the real service directly to check your account.",
        "Reply to the email asking if it's legitimate.",
        "Forward it to a friend to ask what they think.",
      ],
      safestOptionIndex: 1,
      guidance:
        "Urgency is one of the most reliable signs of phishing. Navigate to the service directly yourself rather than clicking the link.",
    },
    quiz: [
      {
        id: "q1",
        question: "What is the main goal of a phishing attack?",
        choices: [
          { text: "To install a virus using advanced hacking tools", isCorrect: false, explanation: "Phishing usually relies on tricking a person, not on breaking through technical defenses." },
          { text: "To trick someone into giving up sensitive information or access", isCorrect: true, explanation: "Correct — phishing exploits trust and urgency rather than technical vulnerabilities." },
          { text: "To slow down a website with excessive traffic", isCorrect: false, explanation: "That describes a denial-of-service attack, a completely different technique." },
          { text: "To physically access a locked computer", isCorrect: false, explanation: "Phishing happens remotely, over messages — not through physical access." },
        ],
      },
      {
        id: "q2",
        question: "Why do phishing messages often create urgency?",
        choices: [
          { text: "To make the message more polite", isCorrect: false, explanation: "Urgency isn't about politeness — it's a pressure tactic." },
          { text: "To rush the reader into acting before they stop to verify the message", isCorrect: true, explanation: "Exactly — pressure discourages the careful, skeptical thinking that would normally expose the scam." },
          { text: "Because most real emails are also urgent", isCorrect: false, explanation: "Most legitimate emails are not urgent — that's part of why urgency is a red flag." },
          { text: "It's required by email formatting standards", isCorrect: false, explanation: "There's no such requirement — this is purely a manipulation tactic." },
        ],
      },
    ],
    relatedTool: { label: "Try the Email Phishing Analyzer", href: "/dashboard/email-scanner" },
    isAvailable: true,
  },
  stub("spear-phishing", "phishing-social-engineering", "Spear Phishing", 2),
  stub("smishing", "phishing-social-engineering", "Smishing", 3),
  stub("vishing", "phishing-social-engineering", "Vishing", 4),
  stub("social-engineering", "phishing-social-engineering", "Social Engineering", 5),
  {
    id: "recognizing-suspicious-messages",
    categoryId: "phishing-social-engineering",
    title: "Recognizing Suspicious Messages",
    difficulty: "beginner",
    estimatedMinutes: 7,
    order: 6,
    objectives: [
      "List common red flags found in suspicious messages.",
      "Practice applying those red flags to a realistic example.",
      "Know the safest general response when a message feels off.",
    ],
    explanation:
      "Most phishing and scam messages share a set of common warning signs: urgency, requests for sensitive information, mismatched sender details, suspicious links, unexpected attachments, and unusual requests for payment. No single sign always means a message is fake, but the more of these signs a message shows, the more cautious you should be.",
    examples: [
      "A message that creates urgency and also asks you to click a link to \"verify\" your password.",
      "An email from \"support@yourbank.com\" that, on closer look, was actually sent from a completely different domain.",
      "A text message with a shortened link you can't preview before clicking.",
    ],
    keyTerms: [
      {
        term: "Sender mismatch",
        simpleExplanation: "When the name shown for a sender doesn't match where the message actually came from.",
        example: "An email displaying \"Apple Support\" as the name, but sent from an unrelated, random-looking address.",
        learnMore: "Checking the actual sender address (not just the display name) is one of the fastest ways to catch impersonation attempts.",
      },
      {
        term: "Link preview",
        simpleExplanation: "Seeing where a link actually leads before clicking it.",
        example: "Hovering over a link on a computer to see the real destination URL in the corner of the screen.",
        learnMore: "On mobile, you can often press and hold a link to preview its destination without opening it.",
      },
    ],
    whyThisMatters:
      "You don't need to catch every clever scam to stay safe — you just need to reliably notice the common patterns and pause when several of them show up together.",
    scenario: {
      prompt:
        "You receive a text saying a package couldn't be delivered and asking you to click a link and pay a small redelivery fee. What's the safest response?",
      options: [
        "Click the link since it's just a small fee.",
        "Ignore the link, and check directly with the shipping carrier's official app or website if you're expecting a package.",
        "Reply with your address to confirm it's correct.",
        "Forward it to the number to ask for more details.",
      ],
      safestOptionIndex: 1,
      guidance:
        "Unexpected delivery-fee messages are a very common scam pattern. Verifying directly through the carrier's real app avoids the fake link entirely.",
    },
    quiz: [
      {
        id: "q1",
        question: "Which of these is the strongest single red flag in a suspicious message?",
        choices: [
          { text: "The message is longer than usual", isCorrect: false, explanation: "Message length by itself isn't a meaningful signal." },
          { text: "It combines urgency with a request for sensitive information or payment", isCorrect: true, explanation: "This combination — pressure plus a request for something valuable — is the classic phishing pattern." },
          { text: "It's sent in the morning", isCorrect: false, explanation: "Time of day has no bearing on legitimacy." },
          { text: "It includes an emoji", isCorrect: false, explanation: "Emoji use says nothing about whether a message is a scam." },
        ],
      },
      {
        id: "q2",
        question: "What's the safest way to check on an unexpected delivery-fee text?",
        choices: [
          { text: "Click the link in the text to see what it says", isCorrect: false, explanation: "This is exactly the risky action the scam is designed to get you to take." },
          { text: "Reply asking who sent it", isCorrect: false, explanation: "Replying confirms your number is active and doesn't verify anything safely." },
          { text: "Go directly to the carrier's official app or website instead of using the link", isCorrect: true, explanation: "Correct — this verifies independently, without any risk from the message's link." },
          { text: "Pay the fee just in case it's real", isCorrect: false, explanation: "Paying an unverified fee risks real financial loss for no confirmed benefit." },
        ],
      },
    ],
    relatedTool: { label: "Try the Email Phishing Analyzer", href: "/dashboard/email-scanner" },
    isAvailable: true,
  },
  {
    id: "http-vs-https",
    categoryId: "web-security",
    title: "HTTP vs HTTPS",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Explain the difference between HTTP and HTTPS.",
      "Understand what HTTPS actually protects against.",
      "Know what HTTPS does NOT guarantee.",
    ],
    explanation:
      "HTTP is the basic protocol browsers use to load web pages. HTTPS is the same thing, but with encryption added — the 'S' stands for Secure. HTTPS scrambles the data traveling between your browser and the website so that anyone else on the network can't read or tamper with it in transit. Almost all legitimate websites use HTTPS today, so its absence is a red flag — but its presence alone doesn't mean a site is trustworthy; it only means the connection itself is encrypted.",
    examples: [
      "A padlock icon in the browser's address bar generally indicates an HTTPS connection.",
      "A phishing site can still use HTTPS — encryption protects the connection, not the site's intentions.",
      "Logging into a website over plain HTTP on public WiFi means your password could potentially be intercepted.",
    ],
    keyTerms: [
      {
        term: "Encryption",
        simpleExplanation: "Scrambling information so that only the intended recipient can read it.",
        example: "HTTPS encrypts your login details so someone else on the same WiFi network can't casually read them.",
        learnMore: "Encryption protects data in transit from being intercepted and read, but doesn't verify who's actually receiving it.",
      },
      {
        term: "SSL/TLS certificate",
        simpleExplanation: "A digital credential that enables HTTPS and helps verify a site's identity.",
        example: "A certificate that proves \"this really is the server for example.com,\" not just some random server.",
        learnMore: "Certificates are covered in more depth in the dedicated SSL/TLS lesson.",
      },
    ],
    whyThisMatters:
      "HTTPS is necessary but not sufficient for safety. Understanding this prevents a common mistake: assuming the padlock icon alone means a site is safe to trust with sensitive information.",
    scenario: {
      prompt: "A website has a padlock icon (HTTPS) but is asking for your Social Security number in an unusual context. What should you conclude?",
      options: [
        "The padlock means the site is definitely legitimate and safe.",
        "The padlock only means the connection is encrypted — it says nothing about whether the site itself is trustworthy.",
        "HTTPS sites never ask for sensitive information.",
        "You should ignore the request entirely without thinking about context.",
      ],
      safestOptionIndex: 1,
      guidance: "HTTPS confirms the connection is encrypted, not that the destination is trustworthy.",
    },
    quiz: [
      {
        id: "q1",
        question: "What does the 'S' in HTTPS actually protect?",
        choices: [
          { text: "It guarantees the website is not a scam", isCorrect: false, explanation: "HTTPS says nothing about the website owner's intentions." },
          { text: "The connection between your browser and the site, so it can't be easily read or altered in transit", isCorrect: true, explanation: "Correct — that's exactly what the added encryption in HTTPS protects." },
          { text: "Your device from viruses", isCorrect: false, explanation: "HTTPS has nothing to do with malware protection on your device." },
          { text: "Your password from being stored anywhere at all", isCorrect: false, explanation: "HTTPS protects data in transit — it says nothing about storage afterward." },
        ],
      },
      {
        id: "q2",
        question: "A phishing website has a padlock icon. What does this tell you?",
        choices: [
          { text: "The site cannot possibly be a phishing site", isCorrect: false, explanation: "Phishing sites commonly use HTTPS too." },
          { text: "Nothing about the site's trustworthiness — only that the connection itself is encrypted", isCorrect: true, explanation: "Exactly right — HTTPS and trustworthiness are two separate questions." },
          { text: "It proves the site is run by a well-known company", isCorrect: false, explanation: "Anyone can obtain an HTTPS certificate, including for a brand-new domain." },
          { text: "It means the site has been manually reviewed for safety", isCorrect: false, explanation: "Obtaining a certificate doesn't involve any review of the site's content or intent." },
        ],
      },
    ],
    relatedTool: { label: "Try the Website Scanner", href: "/dashboard/url-scanner" },
    isAvailable: true,
  },
  stub("dns", "web-security", "DNS", 2),
  stub("ssl-tls", "web-security", "SSL/TLS", 3),
  stub("cookies", "web-security", "Cookies", 4),
  stub("security-headers", "web-security", "Security Headers", 5),
  {
    id: "website-reputation",
    categoryId: "web-security",
    title: "Website Reputation",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 6,
    objectives: [
      "Understand what factors contribute to a website's reputation.",
      "Recognize signs a site might be newly created or previously flagged.",
      "Know how to check a site's reputation before trusting it.",
    ],
    explanation:
      "A website's 'reputation' is a combination of signals that suggest whether it's likely to be legitimate: how long the domain has been registered, whether security vendors have previously flagged it, whether its certificate and hosting look normal, and whether other users have reported problems with it. No single signal is definitive, but combined, they paint a useful picture.",
    examples: [
      "A domain registered within the last few days, especially one imitating a well-known brand name.",
      "A site flagged by multiple independent security vendors for malware or phishing.",
      "A URL that closely mimics a real brand's domain but with a subtle misspelling.",
    ],
    keyTerms: [
      {
        term: "Domain age",
        simpleExplanation: "How long a website's domain name has been registered.",
        example: "A domain registered 10 years ago generally carries more established history than one registered last week.",
        learnMore: "Scam sites are frequently registered, used briefly, and abandoned — a very new domain removes a reassuring signal.",
      },
      {
        term: "Typosquatting",
        simpleExplanation: "Registering a domain that's a common misspelling or lookalike of a popular site.",
        example: "\"arnazon.com\" instead of \"amazon.com\".",
        learnMore: "Typosquatted domains rely on users not noticing small differences, especially when scanning quickly on a mobile keyboard.",
      },
    ],
    whyThisMatters:
      "Knowing what reputation signals exist helps you understand what a tool like CyberSentinel's Website Scanner is actually checking for.",
    scenario: {
      prompt:
        "You find a link to a shopping deal that seems too good to be true, on a domain you've never heard of. What's the safest next step?",
      options: [
        "Enter your card details immediately to secure the deal.",
        "Check the site's reputation first — for example, using a website scanner — before entering any information.",
        "Assume it's fine since the page looks professionally designed.",
        "Share the link with friends immediately so they don't miss out.",
      ],
      safestOptionIndex: 1,
      guidance: "A polished design doesn't require much effort to fake. Checking reputation first is a quick, low-cost habit.",
    },
    quiz: [
      {
        id: "q1",
        question: "Why does domain age matter as a reputation signal?",
        choices: [
          { text: "Older domains are technically faster to load", isCorrect: false, explanation: "Domain age has no bearing on server performance." },
          { text: "Scam sites are often registered briefly and abandoned, so a very new domain removes a reassuring signal", isCorrect: true, explanation: "Exactly — it's not proof of malice, but it is one fewer piece of evidence in the site's favor." },
          { text: "New domains are always safe because they haven't had time to be compromised", isCorrect: false, explanation: "This inverts the actual concern." },
          { text: "Domain age determines a site's search ranking only", isCorrect: false, explanation: "This describes a search engine concept, not a security reputation signal." },
        ],
      },
      {
        id: "q2",
        question: "What is typosquatting?",
        choices: [
          { text: "A technique for making websites load faster", isCorrect: false, explanation: "This is unrelated to performance." },
          { text: "Registering a domain that closely resembles a popular site's name, hoping users won't notice small differences", isCorrect: true, explanation: "Correct — this exploits quick scanning and small typos." },
          { text: "A method websites use to correct spelling errors automatically", isCorrect: false, explanation: "This describes autocorrect, not a security concept." },
          { text: "An official process for registering a new brand's domain", isCorrect: false, explanation: "Typosquatting is an abuse of the domain registration system, not a legitimate process." },
        ],
      },
    ],
    relatedTool: { label: "Try the Website Scanner", href: "/dashboard/url-scanner" },
    isAvailable: true,
  },
  {
    id: "what-is-malware",
    categoryId: "malware",
    title: "What Is Malware?",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Define malware and its general purpose.",
      "Recognize common ways malware spreads.",
      "Understand basic habits that reduce malware risk.",
    ],
    explanation:
      "Malware (short for 'malicious software') is any software designed to harm, exploit, or gain unauthorized access to a device or network. It comes in many specific forms — viruses, worms, trojans, ransomware, spyware — but they all share the common trait of being unwanted, harmful software running without full informed consent. Malware most commonly spreads through malicious email attachments, infected downloads, compromised websites, and infected USB drives.",
    examples: [
      "A downloaded \"free\" program that secretly also installs unwanted tracking software.",
      "An email attachment disguised as an invoice that actually installs malicious software when opened.",
      "A fake software update prompt on a compromised website.",
    ],
    keyTerms: [
      {
        term: "Payload",
        simpleExplanation: "The actual harmful action malware performs once it's running.",
        example: "Encrypting your files (as ransomware does) is one kind of payload.",
        learnMore: "The same delivery method can carry very different payloads — from data theft to file destruction to unauthorized remote access.",
      },
      {
        term: "Executable file",
        simpleExplanation: "A file that runs a program when opened, rather than just displaying content.",
        example: "A file ending in \".exe\" on Windows.",
        learnMore: "Malware is often disguised as a normal-looking file (like a PDF) but is actually an executable.",
      },
    ],
    whyThisMatters:
      "Most malware infections trace back to a small number of common triggers: unexpected attachments, sketchy downloads, and out-of-date software.",
    scenario: {
      prompt: "You receive an unexpected email with an attachment labeled \"Invoice.pdf.exe\" from an unfamiliar sender. What's the safest action?",
      options: [
        "Open it since it says PDF in the name.",
        "Don't open it — the double extension is a classic sign of a disguised executable file.",
        "Forward it to a friend to open first, to be safe.",
        "Rename the file and then open it.",
      ],
      safestOptionIndex: 1,
      guidance: "A file ending in \".pdf.exe\" isn't actually a PDF — it's an executable program disguised to look like one.",
    },
    quiz: [
      {
        id: "q1",
        question: "What is malware, broadly speaking?",
        choices: [
          { text: "Any software that's poorly written", isCorrect: false, explanation: "Malware is specifically about malicious intent, not just poor code quality." },
          { text: "Software designed to harm, exploit, or gain unauthorized access to a device or network", isCorrect: true, explanation: "Correct — this is the defining trait across all specific types of malware." },
          { text: "A type of hardware failure", isCorrect: false, explanation: "Malware is software, not a hardware issue." },
          { text: "Any app that requires an internet connection", isCorrect: false, explanation: "Needing internet access has nothing to do with whether software is malicious." },
        ],
      },
      {
        id: "q2",
        question: "Why is a file named \"Invoice.pdf.exe\" suspicious?",
        choices: [
          { text: "PDF files are always dangerous", isCorrect: false, explanation: "Regular PDF files aren't inherently dangerous — the issue is the disguised file type." },
          { text: "The real file extension is .exe (an executable program), not .pdf, despite the misleading name", isCorrect: true, explanation: "Exactly — this double-extension trick disguises an executable as a harmless document." },
          { text: "Invoices are never sent as email attachments", isCorrect: false, explanation: "Legitimate invoices are sometimes sent as attachments — the file type mismatch is the real red flag." },
          { text: "The filename is too long", isCorrect: false, explanation: "Filename length isn't the relevant issue." },
        ],
      },
    ],
    isAvailable: true,
  },
  stub("viruses", "malware", "Viruses", 2),
  stub("worms", "malware", "Worms", 3),
  stub("trojans", "malware", "Trojans", 4),
  {
    id: "ransomware",
    categoryId: "malware",
    title: "Ransomware",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 5,
    objectives: [
      "Define ransomware and explain how it typically operates.",
      "Understand why paying a ransom is discouraged.",
      "Know the most effective defense against ransomware.",
    ],
    explanation:
      "Ransomware is malware that encrypts (locks) a victim's files and demands payment in exchange for the decryption key needed to restore access. It often spreads through phishing emails or compromised downloads. Security experts and law enforcement generally discourage paying: there's no guarantee the attacker will actually provide a working decryption key, and payment funds further attacks.",
    examples: [
      "A hospital's patient records becoming inaccessible after a ransomware infection, disrupting care until backups are restored.",
      "A ransom note appearing on screen after all personal files are suddenly encrypted.",
      "A small business losing access to years of files because it had no backup separate from the infected system.",
    ],
    keyTerms: [
      {
        term: "Backup",
        simpleExplanation: "A separate, stored copy of your important files.",
        example: "An external hard drive, disconnected from your computer, containing a recent copy of your documents.",
        learnMore: "The single most effective defense against ransomware is having backups stored separately from the systems being protected.",
      },
      {
        term: "Decryption key",
        simpleExplanation: "The information needed to reverse encryption and get your files back.",
        example: "What a ransomware attacker claims they'll provide in exchange for payment.",
        learnMore: "Even when attackers do provide a key after payment, there's no guarantee, and it funds future attacks against other victims.",
      },
    ],
    whyThisMatters:
      "Ransomware targets availability of your own data. Prevention (backups, caution with attachments, updated software) is far more reliable than any response after the fact.",
    scenario: {
      prompt: "Your files suddenly become inaccessible with a message demanding payment to unlock them. What's the most responsible first step?",
      options: [
        "Pay immediately to get your files back as fast as possible.",
        "Disconnect the affected device from the network, and check whether you have a separate backup to restore from.",
        "Try opening the encrypted files repeatedly to see if it fixes itself.",
        "Share your payment details directly with the attacker's provided contact.",
      ],
      safestOptionIndex: 1,
      guidance: "Disconnecting limits further spread, and a clean backup can let you recover without ever engaging with the attacker.",
    },
    quiz: [
      {
        id: "q1",
        question: "What does ransomware typically do to a victim's files?",
        choices: [
          { text: "Deletes them permanently with no way to recover", isCorrect: false, explanation: "Ransomware usually encrypts files rather than deleting them, to demand payment for their return." },
          { text: "Encrypts them and demands payment for the decryption key", isCorrect: true, explanation: "Correct — this is ransomware's defining behavior." },
          { text: "Slowly corrupts them over several years", isCorrect: false, explanation: "Ransomware acts quickly and demands payment, rather than causing slow, silent damage." },
          { text: "Copies them to a public website", isCorrect: false, explanation: "That describes a data leak, not the core ransomware mechanism." },
        ],
      },
      {
        id: "q2",
        question: "Why is having a separate backup the best defense against ransomware?",
        choices: [
          { text: "Backups make your computer run faster", isCorrect: false, explanation: "Backups aren't related to performance." },
          { text: "It lets you restore your files without needing to pay or trust the attacker at all", isCorrect: true, explanation: "Exactly — a clean backup removes the leverage ransomware relies on entirely." },
          { text: "Backups prevent ransomware from ever infecting your device", isCorrect: false, explanation: "A backup doesn't prevent infection — it's what lets you recover afterward." },
          { text: "Paying the ransom is always required even with a backup", isCorrect: false, explanation: "If you have a clean backup, there's no need to pay anything at all." },
        ],
      },
    ],
    isAvailable: true,
  },
  stub("spyware", "malware", "Spyware", 6),
  stub("reduce-malware-risk", "malware", "How to Reduce Malware Risk", 7),
  {
    id: "personally-identifiable-information",
    categoryId: "privacy",
    title: "Personally Identifiable Information",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Define personally identifiable information (PII).",
      "Distinguish between low-risk and high-risk categories of PII.",
      "Understand why minimizing shared PII reduces risk.",
    ],
    explanation:
      "Personally Identifiable Information (PII) is any information that could be used, alone or combined with other information, to identify a specific person. Some PII is relatively low-risk to share (a first name), while other PII is highly sensitive (a Social Security number, a full home address). The general privacy principle is to share only what's actually necessary for a given purpose.",
    examples: [
      "A full name and employer, combined, can sometimes be enough to identify someone even without more sensitive details.",
      "A home address and date of birth together are commonly used to verify identity — and just as easily used to impersonate someone.",
      "A government ID number is almost always high-risk to share and rarely necessary outside formal, verified processes.",
    ],
    keyTerms: [
      {
        term: "PII",
        simpleExplanation: "Any information that could be used to identify a specific person.",
        example: "A name, email address, phone number, or ID number.",
        learnMore: "Some information isn't identifying on its own but becomes identifying when combined with other details.",
      },
      {
        term: "Data minimization",
        simpleExplanation: "Only collecting or sharing the minimum information actually necessary for a purpose.",
        example: "A resume listing a city and state instead of a full home street address.",
        learnMore: "Data minimization reduces your exposure if any single place you've shared information is later breached.",
      },
    ],
    whyThisMatters:
      "Every piece of PII you share is a small addition to your overall exposure. This directly underlies what CyberSentinel's Resume Privacy Scanner checks for.",
    scenario: {
      prompt: "You're filling out a public online form that only needs your general location for shipping estimates. What's the safest amount of detail to provide?",
      options: [
        "Your full home address, date of birth, and phone number, just in case.",
        "Only your city and state/region, since that's all the stated purpose actually requires.",
        "Your Social Security number for verification.",
        "As much personal detail as possible so the company can help you better.",
      ],
      safestOptionIndex: 1,
      guidance: "Matching what you share to what's actually needed for the stated purpose is the core idea of data minimization.",
    },
    quiz: [
      {
        id: "q1",
        question: "What makes something 'personally identifiable information'?",
        choices: [
          { text: "It must be a government-issued number", isCorrect: false, explanation: "PII is broader than just official ID numbers." },
          { text: "It could be used, alone or combined with other data, to identify a specific person", isCorrect: true, explanation: "Correct — this is the general definition." },
          { text: "It must be information you've never shared before", isCorrect: false, explanation: "Whether information is PII doesn't depend on whether you've shared it previously." },
          { text: "It only applies to financial information", isCorrect: false, explanation: "PII covers a much broader category than just financial details." },
        ],
      },
      {
        id: "q2",
        question: "What is 'data minimization'?",
        choices: [
          { text: "Compressing files to save storage space", isCorrect: false, explanation: "This describes file compression, an unrelated technical concept." },
          { text: "Sharing only the minimum information actually necessary for a given purpose", isCorrect: true, explanation: "Correct — this reduces unnecessary exposure." },
          { text: "Deleting all personal data from every account", isCorrect: false, explanation: "It's about being selective going forward, not necessarily deleting everything already shared." },
          { text: "A legal requirement in all countries", isCorrect: false, explanation: "It's a privacy principle and good practice, not a universal legal mandate." },
        ],
      },
    ],
    relatedTool: { label: "Try the Resume Privacy Scanner", href: "/dashboard/resume-scanner" },
    isAvailable: true,
  },
  {
    id: "data-breaches",
    categoryId: "privacy",
    title: "Data Breaches",
    difficulty: "beginner",
    estimatedMinutes: 6,
    order: 2,
    objectives: [
      "Define a data breach and how they typically occur.",
      "Understand what 'no breach found' does and doesn't mean.",
      "Know the recommended steps after learning your information was in a breach.",
    ],
    explanation:
      "A data breach happens when an organization's systems are compromised and information they held is accessed or stolen without authorization. Breaches happen to organizations of every size. Checking whether your email has appeared in a known breach can tell you it was found in a specific database — but a 'not found' result never guarantees your information has never been exposed anywhere.",
    examples: [
      "A retailer's customer database being accessed by attackers exploiting an unpatched vulnerability.",
      "A breach that exposes only email addresses, versus one that also exposes passwords — a meaningfully different risk level.",
      "Learning your email appeared in an old breach from a service you'd forgotten you ever used.",
    ],
    keyTerms: [
      {
        term: "Data breach",
        simpleExplanation: "An incident where protected information is accessed or stolen without authorization.",
        example: "Attackers gaining access to a company's user database.",
        learnMore: "Breaches vary enormously in what's exposed — some involve just email addresses, others involve passwords or financial details.",
      },
      {
        term: "Credential stuffing",
        simpleExplanation: "Attackers trying leaked username/password pairs from one breach against many other websites.",
        example: "A password leaked from an old, unrelated site being tried against your email account.",
        learnMore: "This is exactly why password reuse turns a single breach into a much bigger problem.",
      },
    ],
    whyThisMatters:
      "Understanding what a breach check actually tells you helps you interpret a tool like CyberSentinel's Data Breach Checker accurately.",
    scenario: {
      prompt: "You check your email using a breach-checking tool and it reports no known breaches found. What's the most accurate conclusion?",
      options: [
        "Your account has definitely never been exposed anywhere.",
        "No matching record was found in the specific database checked — this doesn't guarantee your account was never exposed.",
        "You no longer need good password habits.",
        "The tool made an error, since every account eventually gets breached.",
      ],
      safestOptionIndex: 1,
      guidance: "A clean result reflects the limits of what one service can check, not a guarantee about your entire digital history.",
    },
    quiz: [
      {
        id: "q1",
        question: "What is a data breach?",
        choices: [
          { text: "A planned system maintenance window", isCorrect: false, explanation: "A breach is an unauthorized incident, not planned maintenance." },
          { text: "An incident where protected information is accessed or stolen without authorization", isCorrect: true, explanation: "Correct — this is the core definition of a data breach." },
          { text: "A type of computer virus", isCorrect: false, explanation: "A breach is an incident/event, not a specific piece of malware." },
          { text: "A feature that helps protect user data", isCorrect: false, explanation: "A breach is the opposite of a protective feature." },
        ],
      },
      {
        id: "q2",
        question: "If a breach check finds no results for your email, what should you conclude?",
        choices: [
          { text: "Your email has never appeared in any breach, ever", isCorrect: false, explanation: "This overstates what the check can actually confirm." },
          { text: "No matching record was found in the specific database checked", isCorrect: true, explanation: "Correct — this is the accurate, limited scope of a clean result." },
          { text: "You can stop using strong passwords", isCorrect: false, explanation: "Good password habits remain valuable regardless of any single check's result." },
          { text: "The check is guaranteed to be wrong", isCorrect: false, explanation: "A clean result is good information — it's just not an absolute guarantee." },
        ],
      },
    ],
    relatedTool: { label: "Try the Data Breach Checker", href: "/dashboard/breach-checker" },
    isAvailable: true,
  },
  stub("digital-footprints", "privacy", "Digital Footprints", 3),
  stub("privacy-settings", "privacy", "Privacy Settings", 4),
  stub("safe-information-sharing", "privacy", "Safe Information Sharing", 5),
  {
    id: "authentication",
    categoryId: "application-security",
    title: "Authentication",
    difficulty: "intermediate",
    estimatedMinutes: 6,
    order: 1,
    objectives: [
      "Define authentication and distinguish it from authorization.",
      "Understand common authentication methods.",
      "Recognize why authentication design matters for application security.",
    ],
    explanation:
      "Authentication is the process of verifying that a user is who they claim to be — usually through a password, and often reinforced with multi-factor authentication. It answers the question 'who are you?' This is distinct from authorization, which answers 'what are you allowed to do?' A well-designed application enforces strong authentication before ever making decisions about what a logged-in user can access.",
    examples: [
      "Entering a username and password to log into an account.",
      "An app requiring a fresh login after a period of inactivity for sensitive actions.",
      "A banking app requiring biometric confirmation for large transfers, even after you're already logged in.",
    ],
    keyTerms: [
      {
        term: "Authentication",
        simpleExplanation: "Verifying that someone is who they claim to be.",
        example: "Logging in with a correct username and password.",
        learnMore: "Authentication can combine multiple factors for stronger verification than a password alone provides.",
      },
      {
        term: "Session",
        simpleExplanation: "A period of time during which a system remembers you're logged in.",
        example: "Staying logged into a website as you browse between pages without re-entering your password.",
        learnMore: "Poorly secured sessions are a common source of real-world application vulnerabilities.",
      },
    ],
    whyThisMatters:
      "Authentication is the front door of almost every application. Weaknesses here undermine every other security control built on top of it.",
    scenario: {
      prompt: "An app lets you log in with just a 4-digit PIN and offers no MFA option on a feature that handles sensitive financial data. What's the most accurate takeaway?",
      options: [
        "This is perfectly fine as long as the PIN is memorable.",
        "This is a weak authentication design for the sensitivity of what it protects, given how few PIN combinations exist.",
        "PINs are always more secure than passwords.",
        "Authentication design doesn't matter if the app looks professional.",
      ],
      safestOptionIndex: 1,
      guidance: "A 4-digit PIN has only 10,000 possible combinations — far too few for something protecting sensitive financial data.",
    },
    quiz: [
      {
        id: "q1",
        question: "What question does authentication answer?",
        choices: [
          { text: "What am I allowed to do?", isCorrect: false, explanation: "That's the question authorization answers, not authentication." },
          { text: "Who are you?", isCorrect: true, explanation: "Correct — authentication is specifically about verifying identity." },
          { text: "How fast is this system?", isCorrect: false, explanation: "This is a performance question, unrelated to authentication." },
          { text: "What does this button do?", isCorrect: false, explanation: "This is a usability question, not an authentication concept." },
        ],
      },
      {
        id: "q2",
        question: "Why is a 4-digit PIN alone considered weak for sensitive financial access?",
        choices: [
          { text: "PINs are harder to remember than passwords", isCorrect: false, explanation: "Memorability isn't the security concern here." },
          { text: "There are only 10,000 possible combinations, making it easy to guess given enough attempts", isCorrect: true, explanation: "Correct — the small possible combination space is the core weakness." },
          { text: "PINs can't be typed on a phone", isCorrect: false, explanation: "PINs are commonly and easily typed on phones." },
          { text: "PINs are illegal for financial apps", isCorrect: false, explanation: "There's no such blanket legal prohibition — this is a design concern, not a legal one." },
        ],
      },
    ],
    isAvailable: true,
  },
  stub("authorization", "application-security", "Authorization", 2),
  stub("sql-injection", "application-security", "SQL Injection", 3, "intermediate"),
  stub("cross-site-scripting", "application-security", "Cross-Site Scripting", 4, "intermediate"),
  stub("input-validation", "application-security", "Input Validation", 5, "intermediate"),
  {
    id: "owasp-top-10",
    categoryId: "application-security",
    title: "OWASP Top 10",
    difficulty: "intermediate",
    estimatedMinutes: 7,
    order: 6,
    objectives: [
      "Explain what the OWASP Top 10 is and why it exists.",
      "Recognize a few of its most well-known categories at a conceptual level.",
      "Understand why this list is a starting point for developers, not an exhaustive checklist.",
    ],
    explanation:
      "The OWASP Top 10 is a regularly-updated list, published by the nonprofit Open Worldwide Application Security Project, describing the most common and impactful categories of web application security risks. It's widely used by developers and security teams as a shared starting vocabulary for discussing application security priorities. This lesson describes what the categories mean conceptually and defensively — not how to exploit them.",
    examples: [
      "\"Broken Access Control\" describes situations where an application fails to properly enforce what different users are allowed to do.",
      "\"Injection\" describes a broad category of risks where untrusted input is interpreted as commands rather than plain data.",
      "\"Security Misconfiguration\" describes risks introduced by insecure default settings or unnecessary features left enabled.",
    ],
    keyTerms: [
      {
        term: "OWASP",
        simpleExplanation: "A nonprofit organization focused on improving software security, best known for the OWASP Top 10 list.",
        example: "Their Top 10 list is widely referenced in secure coding training and standards.",
        learnMore: "OWASP publishes many free resources beyond the Top 10, aimed at helping developers build more secure applications.",
      },
      {
        term: "Access control",
        simpleExplanation: "The rules that determine what a specific logged-in user is allowed to see or do.",
        example: "Making sure one customer can't view another customer's private order history.",
        learnMore: "Broken access control consistently ranks as one of the most common real-world application security issues.",
      },
    ],
    whyThisMatters:
      "Understanding that a shared, well-known list of common risks exists helps you understand why software security is an ongoing discipline, not a one-time task.",
    scenario: {
      prompt: "You're evaluating whether a software company takes security seriously. Which is the most meaningful positive sign?",
      options: [
        "Their marketing page uses the word 'secure' many times.",
        "They reference following recognized security practices, like those described in the OWASP Top 10, in their engineering process.",
        "Their website loads quickly.",
        "They have a lot of positive reviews about customer support.",
      ],
      safestOptionIndex: 1,
      guidance: "Concrete engineering practices are a more meaningful signal than marketing language or unrelated review categories.",
    },
    quiz: [
      {
        id: "q1",
        question: "What is the OWASP Top 10?",
        choices: [
          { text: "A ranked list of the best antivirus programs", isCorrect: false, explanation: "It's unrelated to antivirus software rankings." },
          { text: "A list of the most common and impactful web application security risk categories", isCorrect: true, explanation: "Correct — it's a widely-used shared reference for application security priorities." },
          { text: "A certification exam for developers", isCorrect: false, explanation: "It's a reference document, not a certification program." },
          { text: "A list of the top 10 hacking tools", isCorrect: false, explanation: "It describes risk categories to defend against, not offensive tools." },
        ],
      },
      {
        id: "q2",
        question: "What does 'Broken Access Control' generally describe?",
        choices: [
          { text: "A website being slow to load", isCorrect: false, explanation: "This is a performance issue, unrelated to access control." },
          { text: "An application failing to properly enforce what different users are allowed to see or do", isCorrect: true, explanation: "Correct — this is the core idea behind this well-known risk category." },
          { text: "A broken login button", isCorrect: false, explanation: "This describes a UI bug, not the security concept of access control." },
          { text: "A website using too many passwords", isCorrect: false, explanation: "This doesn't reflect the actual meaning of the term." },
        ],
      },
    ],
    isAvailable: true,
  },
];

export function getCategoriesWithCounts(): LearningCategory[] {
  return LEARNING_CATEGORIES.map((category) => {
    const lessonsInCategory = LESSONS.filter((lesson) => lesson.categoryId === category.id);
    return {
      ...category,
      lessonCount: lessonsInCategory.length,
      availableLessonCount: lessonsInCategory.filter((lesson) => lesson.isAvailable).length,
    };
  });
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonsByCategory(categoryId: LearningCategoryId): Lesson[] {
  return LESSONS.filter((lesson) => lesson.categoryId === categoryId).sort((a, b) => a.order - b.order);
}

/** Returns the previous/next AVAILABLE lessons across the whole path, in category+order sequence — used for lesson-page navigation. */
export function getAdjacentLessons(lessonId: string): { previous: Lesson | null; next: Lesson | null } {
  const orderedAvailable = LEARNING_CATEGORIES.flatMap((category) => getLessonsByCategory(category.id)).filter(
    (lesson) => lesson.isAvailable
  );
  const index = orderedAvailable.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: index > 0 ? orderedAvailable[index - 1] : null,
    next: index < orderedAvailable.length - 1 ? orderedAvailable[index + 1] : null,
  };
}
