/**
 * Manual backup: POST with Authorization: Bearer <Supabase access_token>.
 * Sends the same JSON snapshot as cron, only for the signed-in user.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_*, MAIL_FROM (same as cron).
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  requireEnv,
  createSmtpTransporter,
  loadBackupPayloadForUser,
  sendBackupEmail,
} from "../lib/backup-shared.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const raw = req.headers.authorization ?? "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ ok: false, error: "Authorization required" });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const mailFrom = requireEnv("MAIL_FROM");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData.user?.id || !authData.user.email) {
      return res.status(401).json({ ok: false, error: "Invalid or expired session" });
    }

    const { user } = authData;
    const payload = await loadBackupPayloadForUser(supabase, user.id);
    const transporter = createSmtpTransporter();
    const dateStr = new Date().toISOString().slice(0, 10);

    await sendBackupEmail({
      transporter,
      mailFrom,
      to: user.email,
      payload,
      subject: `[Better Studio] Manuelles Backup ${dateStr}`,
      text:
        "Anbei dein manuell angefordertes Backup (JSON-Anhang). Das tägliche automatische Backup (Cron) läuft unabhängig weiter.\n\n" +
        "Better Studio Buchhaltung — bitte sicher aufbewahren.",
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[backup/send]", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
