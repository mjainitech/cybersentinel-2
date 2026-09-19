import type { Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../services/logger";
import { createUser, findUserByEmail, findUserById, verifyCredentials, toPublicUser, updatePassword } from "../services/userStore";
import { createResetToken, consumeResetToken, resetTokensAvailable } from "../services/passwordResetStore";
import { sendPasswordResetEmail } from "../services/emailSender";
import { signToken } from "../utils/jwt";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await createUser(name.trim(), email.trim().toLowerCase(), password);
    const token = signToken(user.id, env.JWT_SECRET);

    return res.status(201).json({ token, user });
  } catch (error) {
    logger.error("Registration failed", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong creating your account. Please try again." });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Please enter your email and password." });
  }

  try {
    const user = await verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = signToken(user.id, env.JWT_SECRET);
    return res.json({ token, user });
  } catch (error) {
    logger.error("Login failed", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong signing you in. Please try again." });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = req.userId ? await findUserById(req.userId) : undefined;
    if (!user) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    logger.error("Failed to load current user", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  if (!resetTokensAvailable()) {
    // Honest, not silently fake — a "check your inbox" message here
    // when nothing was ever sent is exactly the bug this replaces.
    return res
      .status(503)
      .json({ error: "Password reset isn't available yet — the server isn't connected to a database. Contact the site administrator." });
  }

  try {
    const user = await findUserByEmail(email);

    // Always respond the same way whether or not the account exists —
    // revealing that distinction lets an attacker enumerate real
    // registered emails, which this deliberately avoids.
    if (user) {
      const token = await createResetToken(user.id);
      const resetUrl = `${env.FRONTEND_ORIGIN}/reset-password?token=${token}`;
      const result = await sendPasswordResetEmail(user.email, resetUrl);
      if (!result.sent) {
        logger.error("Password reset email was not sent", { userId: user.id, reason: result.reason });
      }
    }

    return res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    logger.error("Forgot-password request failed", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body ?? {};

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ error: "Missing or invalid reset link." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const consumed = await consumeResetToken(token);
    if (!consumed) {
      return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    }

    await updatePassword(consumed.userId, password);
    return res.json({ message: "Your password has been reset. You can now log in with your new password." });
  } catch (error) {
    logger.error("Reset-password request failed", { error: String(error) });
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
