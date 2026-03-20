import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.length) throw new Error(`Missing env: ${name}`);
  return v;
}

/** SMTP "From:" header. Optional if it matches the authenticated user — defaults to SMTP_USER. */
export function getMailFrom(): string {
  const explicit = process.env.MAIL_FROM?.trim();
  if (explicit?.length) return explicit;
  return requireEnv("SMTP_USER");
}

export function createSmtpTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!portRaw) missing.push("SMTP_PORT");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");

  if (missing.length > 0) {
    throw new Error(
      `Missing: ${missing.join(", ")}. ` +
        "SMTP is the outgoing mail server the app uses to send backup emails. " +
        "SMTP_HOST is the server hostname from your mail provider " +
        "(e.g. smtp.gmail.com, smtp.office365.com, smtp.sendgrid.net). " +
        "Set SMTP_HOST, SMTP_PORT (often 587), SMTP_USER, and SMTP_PASS in Vercel → Environment Variables.",
    );
  }

  const smtpPort = Number(portRaw);
  if (Number.isNaN(smtpPort)) {
    throw new Error("SMTP_PORT must be a number (e.g. 587).");
  }

  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    auth: { user, pass },
  });
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
    from: params.mailFrom,
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
