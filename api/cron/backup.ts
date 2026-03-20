/**
 * Daily backup cron (Vercel): exports einnahmen, ausgaben, kategorien per auth user and e-mails JSON via nodemailer.
 *
 * Vercel: set CRON_SECRET — requests receive Authorization: Bearer <CRON_SECRET>.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS; optional MAIL_FROM (defaults to SMTP_USER)
 *   Optional: SMTP_SECURE=true (e.g. port 465)
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  requireEnv,
  getMailFrom,
  createSmtpTransporter,
  loadBackupPayloadForUser,
  sendBackupEmail,
} from "../lib/backup-shared.js";

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

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const transporter = createSmtpTransporter();
    const mailFrom = getMailFrom();

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

      const payload = await loadBackupPayloadForUser(supabase, u.id);

      await sendBackupEmail({
        transporter,
        mailFrom,
        to: u.email,
        payload,
        subject: `[Better Studio] Tages-Backup ${dateStr}`,
        text:
          "Anbei findest du das automatische Tages-Backup deiner Buchhaltungsdaten (JSON-Anhang).\n\n" +
          "Better Studio Buchhaltung — bitte sicher aufbewahren.",
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
