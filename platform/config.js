// Little Wonders platform configuration. This file is public (it ships to every browser), so it
// only ever holds public values: the Supabase project URL + anon key and the Stripe Payment Links.
// Leave the fields empty and everything still works in "local mode": progress stays on the device,
// the support buttons are hidden, and nothing is sent anywhere. See docs/PLATFORM.md to go live.
window.LW_CONFIG = {
  siteUrl: 'https://drewsocratix25.github.io/Fantasy-Learning/',
  supabaseUrl: '',           // e.g. 'https://abcdefghijklmnop.supabase.co'
  supabaseAnonKey: '',       // the project's anon (publishable) key, safe to publish
  stripeMonthly: '',         // Stripe Payment Link for $2 / month
  stripeYearly: '',          // Stripe Payment Link for $10 / year
  stripePortal: '',          // Stripe Customer Portal link (manage / cancel)
  supportEmail: '',          // shown on the privacy + terms pages, e.g. 'hello@example.com'
  playCounts: true,          // anonymous daily play counter (game id + date only). Off when Supabase is not configured.
};
