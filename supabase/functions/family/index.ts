// Little Wonders "family" API: one endpoint, an `action` field per request.
//   create  {email}              -> {code, email, supporter}      new family; emails the code
//   join    {code}               -> {code, email(hint), supporter}
//   status  {code}               -> same as join
//   recover {email}              -> {ok}                          emails the family's code(s); never reveals whether the email exists
//   pull    {code, game}         -> {data|null, updatedAt|null}
//   push    {code, game, data}   -> {updatedAt}                   keeps the newest updatedAt
//   ping    {game}               -> {ok}                          anonymous daily play counter
// Called from platform/platform.js with the public anon key. Tables are only reachable with the service role.
import { supa, CORS, json, HttpError, newCode, normalizeCode, validCode, validEmail, validGame, supporterOf, emailHint, sendEmail, codeEmail, rateLimit, clientIp, type Family } from "../_shared/lib.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://drewsocratix25.github.io/Fantasy-Learning/";
const MAX_PROGRESS_BYTES = 64 * 1024;
const FAMILY_COLS = "id, code, email, supporter_until, plan, stripe_customer_id, stripe_subscription_id, subscription_status";

async function familyByCode(code: string): Promise<Family> {
  code = normalizeCode(code); if (!validCode(code)) throw new HttpError(400, "A family code looks like ABCD-EFGH.");
  const db = supa();
  const { data, error } = await db.from("families").select(FAMILY_COLS).eq("code", code).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "We don't know that family code. Check the letters and try again.");
  db.from("families").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id).then(() => {});
  return data as Family;
}

const publicFamily = (f: Family, fullEmail = false) => ({ code: f.code, email: fullEmail ? f.email : emailHint(f.email), supporter: supporterOf(f) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    rateLimit(clientIp(req));
    const body = await req.json().catch(() => ({}));
    const db = supa();
    switch (body.action) {
      case "create": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!validEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
        rateLimit("create:" + clientIp(req), 5, 3_600_000);
        let fam: Family | null = null;
        for (let i = 0; i < 5 && !fam; i++) {
          const { data, error } = await db.from("families").insert({ code: newCode(), email }).select(FAMILY_COLS).maybeSingle();
          if (!error) fam = data as Family; else if (!/duplicate|unique/i.test(error.message)) throw new HttpError(500, error.message);
        }
        if (!fam) throw new HttpError(500, "Could not create a family code. Please try again.");
        const m = codeEmail(fam.code, SITE_URL); await sendEmail(email, m.subject, m.text);
        return json(publicFamily(fam, true));
      }
      case "join": case "status": {
        const fam = await familyByCode(body.code);
        return json(publicFamily(fam));
      }
      case "recover": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!validEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
        rateLimit("recover:" + clientIp(req), 5, 3_600_000);
        const { data } = await db.from("families").select("code").ilike("email", email).order("created_at", { ascending: false }).limit(5);
        if (data && data.length) {
          const codes = data.map((r: { code: string }) => r.code);
          const m = codeEmail(codes[0], SITE_URL);
          await sendEmail(email, m.subject, codes.length > 1 ? m.text + `\nOther codes on this email: ${codes.slice(1).join(", ")}\n` : m.text);
        }
        return json({ ok: true });
      }
      case "pull": {
        const fam = await familyByCode(body.code); if (!validGame(body.game)) throw new HttpError(400, "Bad game id.");
        const { data, error } = await db.from("progress").select("data, updated_at").eq("family_id", fam.id).eq("game_id", body.game).maybeSingle();
        if (error) throw new HttpError(500, error.message);
        return json({ data: data?.data ?? null, updatedAt: data?.updated_at ?? null });
      }
      case "push": {
        const fam = await familyByCode(body.code); if (!validGame(body.game)) throw new HttpError(400, "Bad game id.");
        if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) throw new HttpError(400, "Bad progress payload.");
        const raw = JSON.stringify(body.data); if (raw.length > MAX_PROGRESS_BYTES) throw new HttpError(413, "Progress payload too large.");
        const incoming = Number(body.data.updatedAt || 0);
        const { data: cur } = await db.from("progress").select("data").eq("family_id", fam.id).eq("game_id", body.game).maybeSingle();
        const existing = Number(cur?.data?.updatedAt || 0);
        // A device that is behind never overwrites a newer blob; it will pull, merge and push again.
        if (cur && existing > incoming) return json({ updatedAt: null, kept: "server" });
        const updated_at = new Date().toISOString();
        const { error } = await db.from("progress").upsert({ family_id: fam.id, game_id: body.game, data: body.data, updated_at });
        if (error) throw new HttpError(500, error.message);
        return json({ updatedAt: updated_at });
      }
      case "ping": {
        if (!validGame(body.game)) throw new HttpError(400, "Bad game id.");
        const { error } = await db.rpc("increment_play", { p_game: body.game });
        if (error) throw new HttpError(500, error.message);
        return json({ ok: true });
      }
      default:
        throw new HttpError(400, "Unknown action.");
    }
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    return json({ error: e instanceof Error ? e.message : "Something went wrong." }, status);
  }
});
