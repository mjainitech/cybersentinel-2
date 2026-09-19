/**
 * Signature visual for the hero section: a shield silhouette being
 * "scanned" by a sweeping line, surrounded by pulsing radar rings.
 * This motif — scan lines + pulse rings — is the one visual idea
 * this build should be remembered by, so it's kept isolated here to
 * reuse later (e.g. on the Security Score page) without duplicating markup.
 */
export function ScanVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Pulse rings */}
      <span className="absolute h-56 w-56 rounded-full border border-accent-primary/30 animate-pulse-ring" />
      <span
        className="absolute h-56 w-56 rounded-full border border-accent-secondary/30 animate-pulse-ring"
        style={{ animationDelay: "0.9s" }}
      />
      <span
        className="absolute h-56 w-56 rounded-full border border-accent-primary/20 animate-pulse-ring"
        style={{ animationDelay: "1.8s" }}
      />

      {/* Shield card being scanned */}
      <div className="surface-card relative flex h-72 w-64 flex-col items-center justify-center overflow-hidden">
        <svg width="96" height="108" viewBox="0 0 96 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M48 4L90 20V50C90 76 72 96 48 104C24 96 6 76 6 50V20L48 4Z"
            fill="url(#hero-shield-gradient)"
            fillOpacity="0.14"
            stroke="url(#hero-shield-gradient)"
            strokeWidth="2"
          />
          <path
            d="M32 52L44 64L66 38"
            stroke="url(#hero-shield-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="hero-shield-gradient" x1="6" y1="4" x2="90" y2="104" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F7CFF" />
              <stop offset="1" stopColor="#22D3B8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sweeping scan line */}
        <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent-secondary/25 to-transparent animate-scan-sweep" />

        <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-accent-secondary/80">
          scanning…
        </p>
      </div>
    </div>
  );
}
