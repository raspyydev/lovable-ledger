/**
 * POST /api/ingest/shop-sale
 * Receives paid invoices from Better Studio Website (Shop) and inserts one Einnahme row.
 *
 * Env (Buchhaltung Vercel):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SHOP_INGEST_SECRET          — shared secret; Authorization: Bearer <secret>
 *   BOOKKEEPING_TARGET_USER_ID  — Supabase Auth UUID of the bookkeeping account owner
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.SHOP_INGEST_SECRET;
  if (!secret?.length) return false;
  const h = req.headers.authorization;
  return h === `Bearer ${secret}`;
}

async function nextBelegnr(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("einnahmen").select("belegnr").eq("user_id", userId);
  let max = 0;
  for (const row of data ?? []) {
    const digits = String((row as { belegnr: string }).belegnr).replace(/\D/g, "");
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return String(max + 1).padStart(3, "0");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  let body: Record<string, unknown>;
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body) as Record<string, unknown>;
    } else if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      body = req.body as Record<string, unknown>;
    } else {
      return res.status(400).json({ ok: false, error: "Expected JSON body" });
    }
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  const shopInvoiceNumber = String(body.shopInvoiceNumber ?? "").trim();
  const datum = String(body.datum ?? "").trim();
  const brutto = Number(body.brutto);
  const kundeName = String(body.kundeName ?? "").trim();
  const kundeEmail = String(body.kundeEmail ?? "").trim();
  const beschreibung = String(body.beschreibung ?? "").trim();
  const kategorie = String(body.kategorie ?? "Sonstiges").trim();
  const zahlungsart = body.zahlungsart === "PayPal" ? "PayPal" : "Stripe";

  if (!shopInvoiceNumber || !datum || !Number.isFinite(brutto) || brutto < 0) {
    return res.status(400).json({ ok: false, error: "shopInvoiceNumber, datum, brutto required" });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const targetUserId = requireEnv("BOOKKEEPING_TARGET_USER_ID");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existing } = await supabase
      .from("einnahmen")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("invoice_id", shopInvoiceNumber)
      .maybeSingle();

    if (existing?.id) {
      return res.status(200).json({ ok: true, skipped: true, reason: "already_imported" });
    }

    const belegnr = await nextBelegnr(supabase, targetUserId);
    const id = randomUUID();

    const { error } = await supabase.from("einnahmen").insert({
      id,
      user_id: targetUserId,
      datum,
      belegnr,
      invoice_id: shopInvoiceNumber,
      kunde_name: kundeName || "—",
      kunde_email: kundeEmail || "—",
      beschreibung: beschreibung || "Shop-Verkauf",
      kategorie: kategorie || "Sonstiges",
      brutto: Math.round(brutto * 100) / 100,
      zahlungsart,
    });

    if (error) {
      console.error("[ingest/shop-sale]", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, id, belegnr });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ingest/shop-sale]", msg);
    return res.status(500).json({ ok: false, error: msg });
  }
}
