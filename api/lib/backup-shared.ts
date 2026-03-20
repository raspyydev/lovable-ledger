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
  const smtpHost = requireEnv("SMTP_HOST");
  const smtpPort = Number(requireEnv("SMTP_PORT"));
  const smtpUser = requireEnv("SMTP_USER");
  const smtpPass = requireEnv("SMTP_PASS");
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
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
