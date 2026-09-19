import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { requestPasswordReset } from "@/services/authService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      // Always shown on success, regardless of whether the email was
      // actually registered — matches the backend's intentional
      // non-disclosure (see authController.forgotPassword) so this
      // page can't be used to check which emails have accounts.
      setSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md animate-fade-up p-8" glass>
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/10 p-4 text-center text-sm text-ink">
            If an account exists for that email, a reset link is on its way — check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMessage && (
              <p role="alert" className="rounded-lg border border-accent-danger/25 bg-accent-danger/5 p-3 text-sm text-ink">
                {errorMessage}
              </p>
            )}
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-7 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </Card>
    </AuthLayout>
  );
}
