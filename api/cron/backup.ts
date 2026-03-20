/**
 * Daily backup cron (Vercel): exports einnahmen, ausgaben, kategorien per auth user and e-mails JSON via nodemailer.
 *
 * Vercel: set CRON_SECRET — requests receive Authorization: Bearer <CRON_SECRET>.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM
 *   Optional: SMTP_SECURE=true (e.g. port 465)
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const v = process.env[name]; 
  if (!v?.length) throw new Error(`Missing env: ${name}`);
  return v;
}

function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret?.length) return false;
  const h = req.headers.authorization;
  return h === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const smtpHost = requireEnv("SMTP_HOST");
    const smtpPort = Number(requireEnv("SMTP_PORT"));
    const smtpUser = requireEnv("SMTP_USER");
    const smtpPass = requireEnv("SMTP_PASS");
    const mailFrom = requireEnv("MAIL_FROM");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const allUsers: { id: string; email?: string }[] = [];
    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const batch = data.users.map((u) => ({ id: u.id, email: u.email ?? undefined }));
      allUsers.push(...batch);
      if (data.users.length < perPage) break;
      page += 1;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    let sent = 0;
    let skipped = 0;

    for (const u of allUsers) {
      if (!u.email?.length) {
        skipped += 1;
        continue;
      }

      const [eRes, aRes, kRes] = await Promise.all([
        supabase.from("einnahmen").select("*").eq("user_id", u.id).order("datum", { ascending: false }),
        supabase.from("ausgaben").select("*").eq("user_id", u.id).order("datum", { ascending: false }),
        supabase.from("kategorien").select("*").eq("user_id", u.id).order("created_at", { ascending: true }),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        app: "Better Studio Buchhaltung",
        userId: u.id,
        einnahmen: eRes.data ?? [],
        ausgaben: aRes.data ?? [],
        kategorien: kRes.data ?? [],
      };

      const json = JSON.stringify(payload, null, 2);
      const filename = `better-studio-buchhaltung-backup-${dateStr}.json`;

      await transporter.sendMail({
        from: mailFrom,
        to: u.email,
        subject: `[Better Studio] Tages-Backup ${dateStr}`,
        text:
          "Anbei findest du das automatische Tages-Backup deiner Buchhaltungsdaten (JSON-Anhang).\n\n" +
          "Better Studio Buchhaltung — bitte sicher aufbewahren.",
        attachments: [
          {
            filename,
            content: json,
            contentType: "application/json; charset=utf-8",
          },
        ],
      });

      sent += 1;
    }

    return res.status(200).json({ ok: true, sent, skipped, users: allUsers.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[cron/backup]", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
