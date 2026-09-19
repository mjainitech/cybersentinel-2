import { Award, Lock } from "lucide-react";
import type { Achievement } from "@/services/securityCenterService";
import { cn } from "@/utils/cn";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors",
        achievement.unlocked ? "border-accent-secondary/30 bg-accent-secondary/5" : "border-base-border bg-base-elevated/20"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          achievement.unlocked ? "bg-accent-secondary/15 text-accent-secondary" : "bg-base-elevated text-ink-faint"
        )}
      >
        {achievement.unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </span>
      <p className={cn("text-xs font-medium", achievement.unlocked ? "text-ink" : "text-ink-faint")}>{achievement.title}</p>
      <p className="text-[11px] leading-snug text-ink-faint">{achievement.description}</p>
      {!achievement.unlocked && <span className="text-[10px] uppercase tracking-wide text-ink-faint">Locked</span>}
    </div>
  );
}
