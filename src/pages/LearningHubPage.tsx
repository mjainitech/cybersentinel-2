import { useCallback, useEffect, useState } from "react";
import { GraduationCap, RotateCcw, Award, Trophy } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ExpandableSection } from "@/components/ExpandableSection";
import { XPProgress } from "@/components/XPProgress";
import { LearningStreak } from "@/components/LearningStreak";
import { ProgressBar } from "@/components/ProgressBar";
import { CategoryCard } from "@/components/CategoryCard";
import { LessonCard } from "@/components/LessonCard";
import { LearningSearch } from "@/components/LearningSearch";
import { AchievementCard } from "@/components/AchievementCard";
import { useAuth } from "@/hooks/useAuth";
import { getCatalog, getLearningProfile } from "@/services/learningService";
import type { LearningCategory, CatalogLesson, LearningProfile, LearningAchievement, LessonDifficulty, LearningCategoryId } from "@/services/learningService";

type Status = "loading" | "done" | "error";

export function LearningHubPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [lessons, setLessons] = useState<CatalogLesson[]>([]);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [achievements, setAchievements] = useState<LearningAchievement[]>([]);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<LessonDifficulty | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LearningCategoryId | null>(null);

  const { user } = useAuth();

  const fetchCatalog = useCallback(async () => {
    try {
      const catalog = await getCatalog({
        search: search || undefined,
        difficulty: difficulty ?? undefined,
        category: selectedCategory ?? undefined,
      });
      setCategories(catalog.categories);
      setLessons(catalog.lessons);
    } catch {
      // Handled by the outer status flag on first load; subsequent filter errors fail quietly rather than blanking the page.
    }
  }, [search, difficulty, selectedCategory]);

  const fetchAll = useCallback(async () => {
    setStatus("loading");
    try {
      const [catalog, profileResult] = await Promise.all([
        getCatalog(),
        user ? getLearningProfile() : Promise.resolve(null),
      ]);
      setCategories(catalog.categories);
      setLessons(catalog.lessons);
      if (profileResult) {
        setProfile(profileResult.profile);
        setAchievements(profileResult.achievements);
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "loading") {
      const timeout = setTimeout(fetchCatalog, 250);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty, selectedCategory]);

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingSpinner label="Loading the Learning Hub..." className="mt-16 py-16" />
      </DashboardLayout>
    );
  }

  if (status === "error") {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <p className="text-sm text-ink">The Learning Hub couldn't be loaded.</p>
          <Button variant="outline" size="sm" className="mt-4" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={fetchAll}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const categoryCompletion = (categoryId: LearningCategoryId) =>
    profile?.categoryProgress.find((c) => c.categoryId === categoryId)?.completed ?? 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cta-gradient/10 ring-1 ring-inset ring-accent-primary/20">
            <GraduationCap className="h-5 w-5 text-accent-secondary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Welcome to CyberSentinel Academy</h1>
            <p className="text-sm text-ink-muted">Short lessons, quizzes, and real-world scenarios to build your security fundamentals.</p>
          </div>
        </div>

        {user && profile ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <XPProgress profile={profile} />
            <LearningStreak streak={profile.streak} />
            <Card className="p-5">
              <ProgressBar label="Overall completion" value={profile.lessonsCompleted} max={profile.totalAvailableLessons} color="#22D3B8" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{profile.quizzesCompleted}</p>
                  <p className="text-[11px] text-ink-faint">Quizzes completed</p>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{profile.achievementsEarned}</p>
                  <p className="text-[11px] text-ink-faint">Achievements earned</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-base-border bg-base-elevated/20 p-5 text-center text-sm text-ink-muted">
            Sign in to track your XP, streak, and progress across the Learning Hub.
          </div>
        )}

        <div className="mt-8">
          <LearningSearch search={search} onSearchChange={setSearch} difficulty={difficulty} onDifficultyChange={setDifficulty} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              completed={categoryCompletion(category.id)}
              isSelected={selectedCategory === category.id}
              onSelect={() => setSelectedCategory((prev) => (prev === category.id ? null : category.id))}
            />
          ))}
        </div>

        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-faint">
            {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.title : "All Lessons"}
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {lessons.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No lessons found" description="Try a different search term or filter." />
            ) : (
              lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
            )}
          </div>
        </div>

        {user && (
          <div className="mt-8">
            <ExpandableSection title="Achievements" icon={Award} defaultOpen={false}>
              {achievements.length === 0 ? (
                <EmptyState icon={Trophy} title="No achievements yet" description="Complete your first lesson to start earning achievements." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              )}
            </ExpandableSection>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
