import { Search } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { LessonDifficulty } from "@/services/learningService";

interface LearningSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: LessonDifficulty | null;
  onDifficultyChange: (value: LessonDifficulty | null) => void;
}

const DIFFICULTIES: LessonDifficulty[] = ["beginner", "intermediate", "advanced"];

export function LearningSearch({ search, onSearchChange, difficulty, onDifficultyChange }: LearningSearchProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Input
          placeholder="Search lessons, terms, or topics..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant={difficulty === null ? "secondary" : "outline"} size="sm" onClick={() => onDifficultyChange(null)}>
          All levels
        </Button>
        {DIFFICULTIES.map((d) => (
          <Button
            key={d}
            variant={difficulty === d ? "secondary" : "outline"}
            size="sm"
            onClick={() => onDifficultyChange(d)}
            className="capitalize"
          >
            {d}
          </Button>
        ))}
      </div>
    </div>
  );
}
