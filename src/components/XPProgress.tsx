import { Star } from "lucide-react";
import type { LearningProfile } from "@/services/learningService";

interface XPProgressProps {
  profile: LearningProfile;
}

/** These are CyberSentinel's own internal learning levels — not a professional certification of any kind. */
export function XPProgress({ profile }: XPProgressProps) {
  const percent =
    profile.xpNeededForNextLevel && profile.xpNeededForNextLevel > 0
      ? Math.min(100, Math.round((profile.xpIntoCurrentLevel / profile.xpNeededForNextLevel) * 100))
      : 100;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-warning/10 text-accent-warning">
          <Star className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-ink-faint">Level {profile.level}</p>
          <p className="font-display text-sm font-semibold text-ink">{profile.levelTitle}</p>
        </div>
        <span className="ml-auto font-mono text-sm text-ink-muted">{profile.totalXp} XP</span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-base-elevated">
          <div
            className="h-full rounded-full bg-cta-gradient transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          {profile.xpNeededForNextLevel
            ? `${profile.xpIntoCurrentLevel}/${profile.xpNeededForNextLevel} XP to next level`
            : "Highest level reached"}
        </p>
      </div>

      <p className="mt-3 text-[11px] italic text-ink-faint">
        A CyberSentinel learning level, not a professional security certification.
      </p>
    </div>
  );
}
