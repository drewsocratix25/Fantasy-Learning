// Little Wonders hub: renders the game cards from games.json and runs the support + family-code panels.
(function () {
  const $ = (id) => document.getElementById(id);
  const LW = window.LW;

  // ---- game cards from the registry ----
  fetch('games.json', { cache: 'no-cache' }).then((r) => r.json()).then((reg) => {
    const list = (reg.games || []).filter((g) => g.status === 'live' || g.status === 'soon');
    if (!list.length) return;
    const wrap = $('games'); wrap.innerHTML = '';
    list.forEach((g) => {
      const soon = g.status !== 'live';
      const a = document.createElement(soon ? 'div' : 'a'); a.className = `card ${g.theme || g.id}${soon ? ' soon' : ''}`; if (!soon) a.href = g.path;
      a.innerHTML = `<div class="art"></div><h2></h2><span class="ages"></span><p></p><span class="play${soon ? ' soon' : ''}"></span>`;
      a.querySelector('.art').textContent = g.emoji || '🎮'; a.querySelector('h2').textContent = g.title; a.querySelector('.ages').textContent = `Ages ${g.ages || '3–6'}`;
      a.querySelector('p').textContent = g.tagline || ''; a.querySelector('.play').textContent = soon ? 'Coming soon 🚧' : 'Play ▶';
      wrap.appendChild(a);
    });
  }).catch(() => { /* keep the static cards */ });

  if (!LW) return;
  const cfg = LW.config || {};

  // ---- support buttons (only when Payment Links are configured) ----
  const month = LW.supportUrl('month'), year = LW.supportUrl('year');
  if (month || year) {
    $('support').hidden = false;
    $('supportMonth').hidden = !month; $('supportYear').hidden = !year;
    const refreshLinks = () => { const m = LW.supportUrl('month'), y = LW.supportUrl('year'); if (m) $('supportMonth').href = m; if (y) $('supportYear').href = y; };
    refreshLinks(); LW.family.onChange(refreshLinks);
  }
  const params = new URLSearchParams(location.search);
  if (params.get('thanks')) { $('thanks').hidden = false; history.replaceState(null, '', location.pathname); }

  // ---- family code panel (only in server mode) ----
  if (!LW.enabled) return;
  $('family').hidden = false;
  const msg = (text, err) => { const m = $('familyMsg'); m.textContent = text || ''; m.className = 'msg' + (err ? ' err' : ''); };
  const busy = (form, on) => form.querySelectorAll('button').forEach((b) => { b.disabled = on; });
  function render() {
    const fam = LW.family.info();
    $('familyNone').hidden = !!fam; $('familyHas').hidden = !fam;
    if (fam) {
      $('familyCode').textContent = fam.code; $('supporterBadge').hidden = !LW.supporter.active();
      $('siteUrl').textContent = (cfg.siteUrl || location.href).replace(/^https?:\/\//, '').replace(/\/$/, '');
      const portal = $('portalLink'); portal.hidden = !(cfg.stripePortal && LW.supporter.active()); if (cfg.stripePortal) portal.href = cfg.stripePortal;
    }
  }
  LW.family.onChange(render); render(); LW.family.refresh();
  if (params.get('thanks')) setTimeout(() => LW.family.refresh(), 4000);

  $('createForm').addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target; busy(f, true); msg('Creating your family code…');
    LW.family.create($('createEmail').value).then((fam) => msg(`Your family code is ${fam.code}. We also emailed it to you.`)).catch((err) => msg(err.message, true)).finally(() => busy(f, false));
  });
  $('joinForm').addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target; busy(f, true); msg('Checking the code…');
    LW.family.join($('joinCode').value).then(() => msg('Done! Progress will sync on this device.')).catch((err) => msg(err.message, true)).finally(() => busy(f, false));
  });
  $('joinCode').addEventListener('input', (e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); e.target.value = v.length > 4 ? v.slice(0, 4) + '-' + v.slice(4) : v; });
  $('recoverLink').addEventListener('click', (e) => {
    e.preventDefault(); const email = window.prompt('The grown-up email you used when the family code was created:'); if (!email) return;
    LW.family.recover(email).then(() => msg('If we have a family code for that email, it is on its way.')).catch((err) => msg(err.message, true));
  });
  $('leaveLink').addEventListener('click', (e) => { e.preventDefault(); LW.family.leave(); msg('This device will keep its own progress from now on.'); });
})();
