import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/Button";
import { FeatureCard } from "@/components/FeatureCard";
import { ScanVisual } from "@/components/ScanVisual";
import { landingFeatures } from "@/services/placeholderData";

export function LandingPage() {
  return (
    <MainLayout>
      {/* ------------------------------------------------------------- */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-base-border bg-base-surface px-3.5 py-1.5 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-secondary" />
              Built for students &amp; everyday users
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Protect Your <span className="text-gradient">Digital Life</span> with AI
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Analyze websites, emails, files, and personal information with
              intelligent cybersecurity tools.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Get Started
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" rightIcon={<ChevronDown className="h-4 w-4" />}>
                  Learn More
                </Button>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-ink-faint">
              <span>No credit card required</span>
              <span className="h-1 w-1 rounded-full bg-base-border" />
              <span>Free for students</span>
            </div>
          </div>

          <div className="hidden justify-self-center lg:flex">
            <ScanVisual />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Feature grid                                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="border-t border-base-border/60 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              One assistant, five ways to stay ahead of a threat
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              CyberSentinel breaks down the tools security teams use every day into
              something anyone can run in a browser tab.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {landingFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}

            {/* CTA card filling the sixth grid slot on large screens */}
            <div className="flex flex-col justify-between rounded-xl2 bg-cta-gradient p-6 text-white shadow-glow">
              <div>
                <h3 className="font-display text-base font-semibold">Ready to check your exposure?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  Create a free account and get your first security score.
                </p>
              </div>
              <Link to="/register" className="mt-5">
                <Button variant="secondary" size="sm" className="bg-white/15 text-white hover:bg-white/25">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Closing CTA                                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="border-t border-base-border/60 px-6 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Stay a step ahead of the next phishing attempt
          </h2>
          <p className="max-w-lg text-base text-ink-muted">
            Join CyberSentinel and turn everyday browsing into a habit that protects you.
          </p>
          <Link to="/register">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
