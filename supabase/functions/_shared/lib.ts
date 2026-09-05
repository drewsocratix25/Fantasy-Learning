// Shared helpers for the Little Wonders edge functions.
import { createClient } from "npm:@supabase/supabase-js@2";

export const supa = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Codes avoid look-alike characters (0/O, 1/I/L) so they survive being read aloud or written down.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const s = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}
export const normalizeCode = (c: unknown) =>
  String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.{4})$/, "$1-$2");
export const validCode = (c: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c);
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
export const validGame = (g: unknown) => typeof g === "string" && /^[a-z0-9_-]{1,32}$/.test(g);

export type Family = {
  id: string; code: string; email: string | null; supporter_until: string | null; plan: string | null;
  stripe_customer_id: string | null; stripe_subscription_id: string | null; subscription_status: string | null;
};

export function supporterOf(f: Family | null) {
  const until = f?.supporter_until ? new Date(f.supporter_until) : null;
  return { active: !!until && until.getTime() > Date.now(), until: f?.supporter_until ?? null, plan: f?.plan ?? null };
}

// Show only enough of the email for the parent to recognise it: a***@example.com
export const emailHint = (e: string | null) => (e ? e.replace(/^(.)(.*)(@.*)$/, (_m, a, _b, c) => `${a}***${c}`) : null);

// Transactional email through Resend. Silently skipped when RESEND_API_KEY is not set.
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY"); const from = Deno.env.get("RESEND_FROM") || "Little Wonders <hello@example.com>";
  if (!key) { console.log(`[email skipped] to=${to} subject=${subject}`); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!r.ok) console.error("resend error", r.status, await r.text());
  return r.ok;
}

export function codeEmail(code: string, siteUrl: string) {
  return {
    subject: `Your Little Wonders family code: ${code}`,
    text: `Hello!\n\nYour Little Wonders family code is:\n\n    ${code}\n\nOpen ${siteUrl} on any device, tap "Already have one?" and type the code. Stars, friends and unlocked games will follow your child from device to device.\n\nKeep the code private: anyone who has it can see and change your family's game progress.\n\nLittle Wonders\n(a very small dad-and-daughter business)\n`,
  };
}

// Tiny per-instance rate limiter. Edge instances are short-lived, so this is a speed bump, not a wall.
const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 60, windowMs = 60_000) {
  const now = Date.now(); const h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return; }
  if (++h.n > max) throw new HttpError(429, "Too many requests. Please wait a minute and try again.");
}
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
