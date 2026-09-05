// Stripe -> Little Wonders. Marks a family as a supporter when a subscription is paid and clears it
// when the subscription ends. Deployed with verify_jwt = false (Stripe signs requests itself).
//
// Events handled:
//   checkout.session.completed   link the Stripe customer/subscription to the family (client_reference_id =
//                                family code, set by platform.js). No code? Match by email, or create a family
//                                and email the code, so "support first, sync later" still works.
//   invoice.paid                 extend supporter_until to the end of the paid period (+3 days grace)
//   customer.subscription.updated / .deleted   mirror status; a deleted subscription ends support now
import Stripe from "npm:stripe@17";
import { supa, newCode, sendEmail, codeEmail, type Family } from "../_shared/lib.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");   // API version pinned by the SDK release
const SITE_URL = Deno.env.get("SITE_URL") || "https://drewsocratix25.github.io/Fantasy-Learning/";
const GRACE_MS = 3 * 24 * 3600 * 1000;
const COLS = "id, code, email, supporter_until, plan, stripe_customer_id, stripe_subscription_id, subscription_status";

const planOf = (sub: Stripe.Subscription): "month" | "year" | null => {
  const iv = sub.items.data[0]?.price?.recurring?.interval; return iv === "year" ? "year" : iv === "month" ? "month" : null;
};
const untilOf = (sub: Stripe.Subscription) => new Date(sub.current_period_end * 1000 + GRACE_MS).toISOString();

async function findOrCreateFamily(code: string | null, email: string | null): Promise<Family | null> {
  const db = supa();
  if (code) { const { data } = await db.from("families").select(COLS).eq("code", code).maybeSingle(); if (data) return data as Family; }
  if (!email) return null;
  const { data: byEmail } = await db.from("families").select(COLS).ilike("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (byEmail) return byEmail as Family;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await db.from("families").insert({ code: newCode(), email }).select(COLS).maybeSingle();
    if (!error && data) { const m = codeEmail(data.code, SITE_URL); await sendEmail(email, m.subject, m.text); return data as Family; }
  }
  return null;
}

async function applySubscription(fam: Family, sub: Stripe.Subscription, customerId: string | null) {
  const live = ["active", "trialing", "past_due"].includes(sub.status);   // past_due keeps the badge until Stripe gives up
  const patch = {
    stripe_customer_id: customerId ?? fam.stripe_customer_id, stripe_subscription_id: sub.id, subscription_status: sub.status,
    plan: planOf(sub) ?? fam.plan, supporter_until: live ? untilOf(sub) : new Date().toISOString(),
  };
  const { error } = await supa().from("families").update(patch).eq("id", fam.id);
  if (error) throw error;
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature"); const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sig || !secret) return new Response("missing signature", { status: 400 });
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret); } catch (e) { return new Response(`bad signature: ${(e as Error).message}`, { status: 400 }); }

  const db = supa();
  const { error: dup } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup) return new Response("already processed", { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const email = s.customer_details?.email?.toLowerCase() || null; const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        const fam = await findOrCreateFamily(s.client_reference_id, email);
        if (!fam) { console.error("checkout without email or code", s.id); break; }
        if (!fam.email && email) await db.from("families").update({ email }).eq("id", fam.id);
        if (s.subscription) { const sub = await stripe.subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id); await applySubscription(fam, sub, customerId); }
        else await db.from("families").update({ stripe_customer_id: customerId }).eq("id", fam.id);
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id; if (!subId) break;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null;
        const sub = await stripe.subscriptions.retrieve(subId);
        let { data: fam } = await db.from("families").select(COLS).eq("stripe_subscription_id", subId).maybeSingle();
        if (!fam && customerId) ({ data: fam } = await db.from("families").select(COLS).eq("stripe_customer_id", customerId).maybeSingle());
        if (!fam) fam = await findOrCreateFamily(null, inv.customer_email?.toLowerCase() || null);
        if (fam) await applySubscription(fam as Family, sub, customerId);
        break;
      }
      case "customer.subscription.updated": case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        let { data: fam } = await db.from("families").select(COLS).eq("stripe_subscription_id", sub.id).maybeSingle();
        if (!fam && customerId) ({ data: fam } = await db.from("families").select(COLS).eq("stripe_customer_id", customerId).maybeSingle());
        if (fam) await applySubscription(fam as Family, sub, customerId);
        break;
      }
      default: break;
    }
  } catch (e) {
    console.error(event.type, e);
    await db.from("stripe_events").delete().eq("id", event.id);   // let Stripe retry
    return new Response("error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});
