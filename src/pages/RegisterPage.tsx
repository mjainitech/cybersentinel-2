import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showToast("Those passwords don't match.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate("/dashboard");
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
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Free for students — start with your first security scan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            type="text"
            label="Name"
            placeholder="Jordan Lee"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            leftIcon={<User className="h-4 w-4" />}
          />

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

          <Input
            type="password"
            label="Password"
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
            label="Confirm Password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-1 w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-primary hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
