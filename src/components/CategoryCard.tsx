import type { LearningCategory } from "@/services/learningService";
import { ProgressBar } from "@/components/ProgressBar";
import { cn } from "@/utils/cn";

interface CategoryCardProps {
  category: LearningCategory;
  completed: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function CategoryCard({ category, completed, isSelected, onSelect }: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "surface-card flex flex-col gap-3 p-5 text-left transition-colors hover:border-accent-primary/40",
        isSelected && "border-accent-primary/50 ring-1 ring-inset ring-accent-primary/25"
      )}
    >
      <div>
        <h3 className="font-display text-sm font-semibold text-ink">{category.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{category.description}</p>
      </div>
      <ProgressBar label="Progress" value={completed} max={category.availableLessonCount} />
      {category.lessonCount > category.availableLessonCount && (
        <p className="text-[11px] text-ink-faint">
          {category.lessonCount - category.availableLessonCount} more lesson
          {category.lessonCount - category.availableLessonCount === 1 ? "" : "s"} coming soon
        </p>
      )}
    </button>
  );
}
