import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import { resetPassword } from "@/services/authService";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      showToast("This reset link is missing its token — please use the link from your email.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Those passwords don't match.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setDone(true);
      showToast("Password reset. You can now log in.", "success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md animate-fade-up p-8" glass>
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>
          <p className="mt-2 text-sm text-ink-muted">Choose a new password for your account.</p>
        </div>

        {!token ? (
          <div className="rounded-xl border border-accent-danger/25 bg-accent-danger/5 p-4 text-center text-sm text-ink">
            This link is missing its reset token. Please use the link from your email, or{" "}
            <Link to="/forgot-password" className="font-medium text-accent-primary hover:underline">
              request a new one
            </Link>
            .
          </div>
        ) : done ? (
          <div className="rounded-xl border border-accent-secondary/30 bg-accent-secondary/10 p-4 text-center text-sm text-ink">
            Your password has been reset. Redirecting you to log in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              type="password"
              label="New Password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint="At least 8 characters."
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              type="password"
              label="Confirm New Password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
              Reset Password
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
