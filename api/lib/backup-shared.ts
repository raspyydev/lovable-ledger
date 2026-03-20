import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.length) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Same env names as BetterService BWA: MAIL_USER / MAIL_PASS, fallback SMTP_USER / SMTP_PASS. */
export function getMailCredentials(): { user: string; pass: string } {
  const user =
    process.env.MAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim();
  const pass =
    process.env.MAIL_PASS?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    process.env.SMTP_PASSWORD?.trim();

  if (!user || !pass) {
    throw new Error(
      "Missing mail credentials. Set MAIL_USER + MAIL_PASS (Gmail App Password), same as BWA — or SMTP_USER + SMTP_PASS. " +
        "Google Account → Security → 2-Step Verification → App passwords.",
    );
  }
  return { user, pass };
}

/**
 * Nodemailer setup aligned with BWA Webseite (lib/email.ts):
 * - If SMTP_HOST is set: custom host/port (SendGrid, Office365, etc.)
 * - Else: service "gmail" + pool/rateLimit (no SMTP_HOST/SMTP_PORT needed)
 */
export function createSmtpTransporter() {
  const { user, pass } = getMailCredentials();
  const smtpHost = process.env.SMTP_HOST?.trim();

  if (smtpHost) {
    const portRaw = process.env.SMTP_PORT?.trim() || "587";
    const smtpPort = Number(portRaw);
    if (Number.isNaN(smtpPort)) {
      throw new Error("SMTP_PORT must be a number (e.g. 587).");
    }
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
  });
}

/** "From" header: MAIL_FROM, else same account as MAIL_USER / SMTP_USER. */
export function getMailFrom(): string {
  const explicit = process.env.MAIL_FROM?.trim();
  if (explicit?.length) return explicit;
  const user =
    process.env.MAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim();
  if (!user?.length) {
    throw new Error("Missing MAIL_FROM or MAIL_USER / SMTP_USER.");
  }
  return user;
}

export function formatBackupFromHeader(mailFrom: string): string {
  if (mailFrom.includes("<") && mailFrom.includes(">")) return mailFrom;
  return `"Better Studio Buchhaltung" <${mailFrom}>`;
}

export async function loadBackupPayloadForUser(supabase: SupabaseClient, userId: string) {
  const [eRes, aRes, kRes] = await Promise.all([
    supabase.from("einnahmen").select("*").eq("user_id", userId).order("datum", { ascending: false }),
    supabase.from("ausgaben").select("*").eq("user_id", userId).order("datum", { ascending: false }),
    supabase.from("kategorien").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    app: "Better Studio Buchhaltung",
    userId,
    einnahmen: eRes.data ?? [],
    ausgaben: aRes.data ?? [],
    kategorien: kRes.data ?? [],
  };
}

export async function sendBackupEmail(params: {
  transporter: nodemailer.Transporter;
  mailFrom: string;
  to: string;
  payload: Record<string, unknown>;
  subject: string;
  text: string;
}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(params.payload, null, 2);
  const filename = `better-studio-buchhaltung-backup-${dateStr}.json`;
  await params.transporter.sendMail({
    from: formatBackupFromHeader(params.mailFrom),
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: [
      {
        filename,
        content: json,
        contentType: "application/json; charset=utf-8",
      },
    ],
  });
}
