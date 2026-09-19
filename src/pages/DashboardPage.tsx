import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { dashboardFeatures } from "@/services/placeholderData";

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0];

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-ink-muted">Welcome back,</p>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {firstName ?? "there"} 👋
            </h1>
          </div>

          {user ? (
            <Card className="flex items-center gap-3 px-4 py-3 sm:w-fit" glass>
              <Sparkles className="h-4 w-4 text-accent-secondary" />
              <p className="text-sm text-ink-muted">
                Your tools are almost ready — new scanners are rolling out soon.
              </p>
            </Card>
          ) : (
            <Card className="flex items-center gap-3 px-4 py-3 sm:w-fit" glass>
              <Sparkles className="h-4 w-4 text-accent-secondary" />
              <p className="text-sm text-ink-muted">
                <Link to="/login" className="font-medium text-accent-primary hover:underline">
                  Sign in
                </Link>{" "}
                to save your scans and build a security history.
              </p>
            </Card>
          )}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              action={
                feature.to ? (
                  <Link to={feature.to}>
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} className="w-full">
                      Open Scanner
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" disabled className="w-full cursor-default">
                    Coming Soon
                  </Button>
                )
              }
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
