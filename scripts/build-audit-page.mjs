// Turn data/price-audit.json into one reviewable page.
//
//   node scripts/price-audit.mjs --json --shopsuki <catalogue.json>
//   node scripts/build-audit-page.mjs [outfile]
//
// The point is checking, not decoration: every line shows what was bought, what
// it cost, which source said so, and every adjustment the engine applied. If a
// number on this page is wrong, the fix is in the code, not here.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const src = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "price-audit.json"), "utf8"));
const outFile = process.argv[2] || path.join(ROOT, "data", "price-audit.html");

// The researched drafts are optional: the page still builds without them.
const draftPath = path.join(ROOT, "data", "draft-audit.json");
const draftSrc = fs.existsSync(draftPath) ? JSON.parse(fs.readFileSync(draftPath, "utf8")) : null;

// Trim the payload to what the page actually renders.
const data = {
  sheet: src.sheet,
  problems: src.problems,
  recipes: src.recipes.map((r) => ({
    n: r.name,
    s: r.servings,
    t: r.total,
    i: r.ingredients.map((x) => ({
      n: x.name,
      a: x.amount,
      c: x.cost,
      s: x.source,
      d: x.detail,
      u: x.unitPrice,
      un: x.unit,
      o: x.optional || undefined,
      j: x.adjustment || undefined,
    })),
    p: r.pantry.map((p) => p.name + " (" + p.amount + ")"),
  })),
  da: src.sources.da.map((d) => ({
    n: d.name,
    dn: d.display,
    c: d.category,
    p: d.price,
    u: d.pricedIngredients,
    h: d.hiddenOnSite || undefined,
  })),
  dti: src.sources.dti
    ? {
        eff: src.sources.dti.effective,
        r: src.sources.dti.records.map((x) => ({
          s: x.section,
          p: x.product,
          z: x.size,
          v: x.srp,
          w: x.wrapped || undefined,
        })),
      }
    : null,
  shop: src.sources.shopsuki
    ? {
        total: src.sources.shopsuki.totalProducts,
        items: src.sources.shopsuki.items.map((i) => ({
          n: i.name,
          ct: i.chosen.title,
          cp: i.chosen.price,
          c: i.candidates.map((c) => ({ t: c.title, y: c.type, p: c.price })),
        })),
      }
    : null,
  dr: draftSrc
    ? {
        c: draftSrc.counts,
        dupes: draftSrc.dupes,
        d: draftSrc.drafts.map((x) => ({
          n: x.name,
          pr: x.protein,
          m: x.method,
          src: x.source,
          st: x.ready ? "ready" : x.blockers.length ? "blocked" : "wiring",
          t: x.total,
          i: x.ingredients.map((g) => ({
            n: g.name, a: g.amount, o: g.optional || undefined, s: g.status,
            c: g.cost === null ? undefined : g.cost,
          })),
          pp: (x.pricedPantry || []).map((g) => ({
            n: g.name, a: g.amount, c: g.cost === null ? undefined : g.cost, o: g.optional || undefined,
          })),
          p: (x.pantry || []).map((g) => g.name + " " + g.amount),
        })),
        g: draftSrc.goods.map((g) => ({
          n: g.good,
          r: g.req,
          o: g.opt,
          s: g.status,
          d: g.detail,
          ex: g.dishes.slice(0, 3),
          sp: g.spellings.length > 1 ? g.spellings : undefined,
        })),
      }
    : null,
};

const totals = {
  recipes: data.recipes.length,
  da: data.da.length,
  daPriced: data.da.filter((d) => d.p !== null).length,
  dti: data.dti ? data.dti.r.length : 0,
  shopTotal: data.shop ? data.shop.total : 0,
  shopCandidates: data.shop ? data.shop.items.reduce((s, i) => s + i.c.length, 0) : 0,
};

const lines = {
  DA: 0,
  ShopSuki: 0,
  Chan: 0,
};
const goods = { DA: new Set(), ShopSuki: new Set(), Chan: new Set() };
for (const r of data.recipes) {
  for (const i of r.i) {
    if (lines[i.s] !== undefined) {
      lines[i.s]++;
      goods[i.s].add(i.n);
    }
  }
}

const payload = JSON.stringify(data).replace(/</g, "\\u003c");

const html = `<title>Ano Ulam — price audit</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: oklch(0.992 0.0015 60);
    --surface: oklch(1 0 0);
    --ink: oklch(0.24 0.012 50);
    --muted: oklch(0.52 0.012 50);
    --rule: oklch(0.90 0.006 60);
    --rule-strong: oklch(0.80 0.008 60);
    --accent: oklch(0.55 0.18 32);
    --da: oklch(0.46 0.12 150);
    --da-bg: oklch(0.94 0.04 150);
    --shop: oklch(0.48 0.14 265);
    --shop-bg: oklch(0.94 0.035 265);
    --chan: oklch(0.50 0.12 70);
    --chan-bg: oklch(0.94 0.05 75);
    --sans: ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --mono: ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: oklch(0.17 0.008 55);
      --surface: oklch(0.21 0.010 55);
      --ink: oklch(0.93 0.005 60);
      --muted: oklch(0.66 0.010 55);
      --rule: oklch(0.29 0.010 55);
      --rule-strong: oklch(0.38 0.012 55);
      --accent: oklch(0.72 0.15 40);
      --da: oklch(0.78 0.13 150);
      --da-bg: oklch(0.30 0.05 150);
      --shop: oklch(0.78 0.12 265);
      --shop-bg: oklch(0.30 0.05 265);
      --chan: oklch(0.80 0.12 78);
      --chan-bg: oklch(0.31 0.05 75);
    }
  }
  :root[data-theme="dark"] {
    --bg: oklch(0.17 0.008 55);
    --surface: oklch(0.21 0.010 55);
    --ink: oklch(0.93 0.005 60);
    --muted: oklch(0.66 0.010 55);
    --rule: oklch(0.29 0.010 55);
    --rule-strong: oklch(0.38 0.012 55);
    --accent: oklch(0.72 0.15 40);
    --da: oklch(0.78 0.13 150);
    --da-bg: oklch(0.30 0.05 150);
    --shop: oklch(0.78 0.12 265);
    --shop-bg: oklch(0.30 0.05 265);
    --chan: oklch(0.80 0.12 78);
    --chan-bg: oklch(0.31 0.05 75);
  }
  :root[data-theme="light"] {
    --bg: oklch(0.992 0.0015 60);
    --surface: oklch(1 0 0);
    --ink: oklch(0.24 0.012 50);
    --muted: oklch(0.52 0.012 50);
    --rule: oklch(0.90 0.006 60);
    --rule-strong: oklch(0.80 0.008 60);
    --accent: oklch(0.55 0.18 32);
    --da: oklch(0.46 0.12 150);
    --da-bg: oklch(0.94 0.04 150);
    --shop: oklch(0.48 0.14 265);
    --shop-bg: oklch(0.94 0.035 265);
    --chan: oklch(0.50 0.12 70);
    --chan-bg: oklch(0.94 0.05 75);
  }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 62rem; margin: 0 auto; padding: 0 1.25rem 5rem; }

  header { padding: 2.75rem 0 1.5rem; }
  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 1.2rem + 1.8vw, 2.3rem);
    letter-spacing: -0.025em;
    font-weight: 640;
    text-wrap: balance;
  }
  .sub { margin: 0.4rem 0 0; color: var(--muted); max-width: 46ch; }
  .sheet {
    margin-top: 1rem; font-family: var(--mono); font-size: 0.78rem;
    color: var(--muted);
  }

  .stats {
    display: flex; flex-wrap: wrap; gap: 0 2.25rem;
    margin: 1.5rem 0 0; padding: 1rem 0 0; border-top: 1px solid var(--rule-strong);
  }
  .stat { margin: 0 0 0.6rem; }
  .stat b {
    display: block; font-family: var(--mono); font-size: 1.35rem;
    font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
  }
  .stat span { font-size: 0.76rem; color: var(--muted); }

  nav { position: sticky; top: 0; z-index: 10; background: var(--bg); padding: 0.75rem 0 0; }
  .tabs {
    display: flex; gap: 0.35rem; flex-wrap: wrap;
    border-bottom: 1px solid var(--rule-strong); padding-bottom: 0.75rem;
  }
  .tabs button {
    font: inherit; font-size: 0.87rem; font-weight: 520;
    background: transparent; color: var(--muted);
    border: 1px solid transparent; border-radius: 999px;
    padding: 0.32rem 0.85rem; cursor: pointer;
  }
  .tabs button:hover { color: var(--ink); }
  .tabs button[aria-selected="true"] {
    background: var(--surface); color: var(--ink); border-color: var(--rule-strong);
  }
  .tabs button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .filter { display: flex; gap: 0.6rem; align-items: center; margin: 1rem 0 0; }
  .filter input {
    font: inherit; font-size: 0.9rem; flex: 1; min-width: 0;
    padding: 0.45rem 0.7rem; color: var(--ink);
    background: var(--surface); border: 1px solid var(--rule-strong); border-radius: 7px;
  }
  .filter input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .count { font-family: var(--mono); font-size: 0.76rem; color: var(--muted); white-space: nowrap; }

  .rec { border-bottom: 1px solid var(--rule); padding: 1.15rem 0; }
  .rec-head { display: flex; align-items: baseline; gap: 0.75rem; }
  .rec-head h3 {
    margin: 0; font-size: 1.02rem; font-weight: 600; letter-spacing: -0.01em; flex: 1;
  }
  .rec-head .serv { font-size: 0.74rem; color: var(--muted); }
  .rec-head .tot {
    font-family: var(--mono); font-size: 1.02rem; font-weight: 600;
    font-variant-numeric: tabular-nums; color: var(--accent);
  }

  table { width: 100%; border-collapse: collapse; margin-top: 0.65rem; }
  td { padding: 0.22rem 0; vertical-align: baseline; font-size: 0.87rem; }
  td.tag { width: 1%; white-space: nowrap; padding-right: 0.6rem; }
  td.amt { color: var(--muted); font-size: 0.8rem; white-space: nowrap; padding-left: 0.6rem; }
  td.num {
    width: 1%; text-align: right; font-family: var(--mono);
    font-variant-numeric: tabular-nums; white-space: nowrap; padding-left: 0.8rem;
  }
  tr.opt td { color: var(--muted); }
  .why {
    font-size: 0.76rem; color: var(--muted); padding: 0 0 0.3rem 0;
    font-family: var(--mono); line-height: 1.45;
  }
  .why em { font-style: normal; color: var(--accent); }

  .chip {
    display: inline-block; font-family: var(--mono); font-size: 0.66rem;
    font-weight: 600; letter-spacing: 0.03em;
    padding: 0.08rem 0.4rem; border-radius: 4px;
  }
  .chip.DA { color: var(--da); background: var(--da-bg); }
  .chip.ShopSuki { color: var(--shop); background: var(--shop-bg); }
  .chip.Chan { color: var(--chan); background: var(--chan-bg); }
  .chip.free { color: var(--muted); background: var(--rule); }
  .chip.ready { color: var(--da); background: var(--da-bg); }
  .chip.wiring { color: var(--shop); background: var(--shop-bg); }
  .chip.blocked { color: var(--accent); background: oklch(0.94 0.045 32); }
  @media (prefers-color-scheme: dark) {
    .chip.blocked { background: oklch(0.31 0.055 40); }
  }
  .need { color: var(--accent); font-weight: 600; }
  .ings { margin: 0.4rem 0 0; font-size: 0.84rem; line-height: 1.7; }
  .ings .g { color: var(--muted); }
  .src { margin: 0.35rem 0 0; font-size: 0.74rem; color: var(--muted); }

  .free { margin-top: 0.5rem; font-size: 0.78rem; color: var(--muted); }

  .listing { width: 100%; border-collapse: collapse; }
  .listing th {
    text-align: left; font-size: 0.72rem; font-weight: 600; color: var(--muted);
    padding: 0.5rem 0.6rem 0.5rem 0; border-bottom: 1px solid var(--rule-strong);
    background: var(--bg);
  }
  /* One long table per tab, so a sticky head helps. ShopSuki has eight and a
     sticky head there parks itself on top of the block above it. */
  #p-da .listing th, #p-dti .listing th {
    position: sticky; top: 3.9rem;
  }
  .listing th.r, .listing td.r { text-align: right; }
  .listing td {
    padding: 0.3rem 0.6rem 0.3rem 0; border-bottom: 1px solid var(--rule); font-size: 0.85rem;
  }
  .listing td.r { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .listing tr.dim td { color: var(--muted); }
  .scroll { overflow-x: auto; }

  .grp { margin: 1.75rem 0 0; }
  .grp h3 {
    margin: 0 0 0.15rem; font-size: 0.95rem; font-weight: 620; letter-spacing: -0.005em;
  }
  .grp .chosen {
    font-family: var(--mono); font-size: 0.78rem; color: var(--muted); margin: 0 0 0.5rem;
  }
  .grp .chosen b { color: var(--ink); font-weight: 600; }
  .pick td { background: var(--surface); font-weight: 600; }

  .note {
    margin: 1.25rem 0 0; padding: 0.85rem 1rem; background: var(--surface);
    border: 1px solid var(--rule-strong); border-radius: 8px;
    font-size: 0.84rem; color: var(--muted);
  }
  .note b { color: var(--ink); }
  .ok { color: var(--da); font-weight: 600; }
  footer { margin-top: 3rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); font-size: 0.78rem; color: var(--muted); }
  @media (max-width: 640px) {
    td.amt { display: none; }
    .stats { gap: 0 1.5rem; }
  }
</style>

<div class="wrap">
  <header>
    <h1>Every peso, and who said so</h1>
    <p class="sub">The whole ano ulam recipe book with each ingredient priced, and each price traced back to the source that set it.</p>
    <p class="sheet">DA sheet: ${data.sheet}</p>
    <div class="stats">
      <p class="stat"><b>${totals.recipes}</b><span>recipes</span></p>
      <p class="stat"><b>${lines.DA}</b><span>lines from the DA</span></p>
      <p class="stat"><b>${lines.ShopSuki}</b><span>lines from ShopSuki</span></p>
      <p class="stat"><b>${lines.Chan}</b><span>lines priced by Chan</span></p>
      <p class="stat"><b>${data.problems.length}</b><span>untraced prices</span></p>
    </div>
  </header>

  <nav>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="true" data-tab="recipes">Recipes</button>
      <button role="tab" aria-selected="false" data-tab="da">DA Bantay Presyo</button>
      <button role="tab" aria-selected="false" data-tab="dti">DTI SRP</button>
      <button role="tab" aria-selected="false" data-tab="shop">ShopSuki</button>
      <button role="tab" aria-selected="false" data-tab="drafts">Researched (203)</button>
      <button role="tab" aria-selected="false" data-tab="goods">Goods to price</button>
    </div>
    <div class="filter">
      <input id="q" type="search" placeholder="Filter by name, brand or source" aria-label="Filter">
      <span class="count" id="count"></span>
    </div>
  </nav>

  <main>
    <section id="p-recipes"></section>
    <section id="p-da" hidden></section>
    <section id="p-dti" hidden></section>
    <section id="p-shop" hidden></section>
    <section id="p-drafts" hidden></section>
    <section id="p-goods" hidden></section>
  </main>

  <footer>
    Generated by <code>scripts/price-audit.mjs</code>, which cross-checks every total against the app's own cost engine.
    DA prices are the Department of Agriculture's daily NCR retail index.
  </footer>
</div>

<script>
const D = ${payload};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const peso = (n) => "\\u20b1" + (Math.round(n * 100) / 100).toLocaleString("en-PH");

let tab = "recipes";
let q = "";

function recipeHTML(r) {
  const rows = r.i.map((x) => {
    const why = x.s === "DA" || x.s === "ShopSuki"
      ? esc(x.d) + " at " + peso(x.u) + "/" + (x.un === "kg" ? "kg" : x.un === "tali" ? "tali" : "pc")
      : x.s === "Chan" ? esc(x.d) : "";
    const adj = x.j ? '<div class="why"><em>adjusted</em> ' + esc(x.j) + "</div>" : "";
    return '<tr class="' + (x.o ? "opt" : "") + '">' +
        '<td class="tag"><span class="chip ' + x.s + '">' + (x.s === "ShopSuki" ? "SHOP" : x.s.toUpperCase()) + "</span></td>" +
        "<td>" + esc(x.n) + (x.o ? " <span class=\\"count\\">optional</span>" : "") + "</td>" +
        '<td class="amt">' + esc(x.a) + "</td>" +
        '<td class="num">' + peso(x.c) + "</td>" +
      "</tr>" +
      (why || adj ? '<tr><td></td><td colspan="3"><div class="why">' + why + "</div>" + adj + "</td></tr>" : "");
  }).join("");

  const free = r.p.length
    ? '<p class="free"><span class="chip free">FREE</span> ' + esc(r.p.join(", ")) + "</p>"
    : "";

  return '<article class="rec">' +
      '<div class="rec-head"><h3>' + esc(r.n) + "</h3>" +
      '<span class="serv">' + esc(r.s) + "</span>" +
      '<span class="tot">' + peso(r.t) + "</span></div>" +
      "<table>" + rows + "</table>" + free +
    "</article>";
}

function render() {
  const needle = q.trim().toLowerCase();
  const hit = (s) => !needle || String(s).toLowerCase().includes(needle);

  const recipes = D.recipes.filter((r) => hit(r.n) || r.i.some((x) => hit(x.n) || hit(x.d) || hit(x.s)));
  document.getElementById("p-recipes").innerHTML =
    (D.problems.length
      ? '<div class="note"><b>' + D.problems.length + " problem(s):</b> " + esc(D.problems.join(" | ")) + "</div>"
      : '<div class="note"><b class="ok">Every price has a source.</b> Each total below was re-computed independently and matched against the app\\u2019s cost engine, to the peso.</div>') +
    recipes.map(recipeHTML).join("");

  const da = D.da.filter((d) => hit(d.n) || hit(d.dn) || hit(d.c));
  document.getElementById("p-da").innerHTML =
    '<div class="note">Every row on today\\u2019s Daily Price Index, including the ones the app hides or does not use yet. <b>' +
      D.da.filter((d) => d.u.length).length + "</b> of them price an ingredient in the book.</div>" +
    '<div class="scroll"><table class="listing"><thead><tr><th>Shown as</th><th>DA name</th><th>Category</th><th class="r">Price</th><th>Used for</th></tr></thead><tbody>' +
    da.map((d) => '<tr class="' + (d.p === null || d.h ? "dim" : "") + '">' +
        "<td>" + esc(d.dn) + (d.h ? ' <span class="count">hidden</span>' : "") + "</td>" +
        "<td>" + esc(d.n) + "</td><td>" + esc(d.c) + "</td>" +
        '<td class="r">' + (d.p === null ? "n/a" : peso(d.p)) + "</td>" +
        "<td>" + esc(d.u.join(", ")) + "</td></tr>").join("") +
    "</tbody></table></div>";

  const dti = D.dti ? D.dti.r.filter((x) => hit(x.p) || hit(x.s)) : [];
  document.getElementById("p-dti").innerHTML = !D.dti
    ? '<div class="note">Not fetched yet.</div>'
    : '<div class="note">DTI Suggested Retail Prices, effective <b>' + esc(D.dti.eff) +
        "</b>. An SRP is a legal <b>ceiling</b>, not a shelf price, and this bulletin is republished about once a year. " +
        "Nothing here prices a dish today; it is here for the canned goods the new recipes will need.</div>" +
      '<div class="scroll"><table class="listing"><thead><tr><th>Section</th><th>Product</th><th>Size</th><th class="r">SRP</th></tr></thead><tbody>' +
      dti.map((x) => '<tr class="' + (x.w ? "dim" : "") + '"><td>' + esc(x.s || "\\u2014") +
        (x.w ? ' <span class="count">section unverified</span>' : "") + "</td><td>" + esc(x.p) +
        "</td><td>" + esc(x.z) + '</td><td class="r">' + peso(x.v) + "</td></tr>").join("") +
      "</tbody></table></div>";

  document.getElementById("p-shop").innerHTML = !D.shop
    ? '<div class="note">Not fetched yet.</div>'
    : '<div class="note"><b>' + D.shop.total.toLocaleString("en-PH") + "</b> products in the catalogue, almost all of it soap and candy. " +
        "What matters is the shortlist: every product that passes an item\\u2019s filters, with the chosen pack highlighted. " +
        "The cheapest row is not always the pick, because a cheaper pack is often just a smaller pack.</div>" +
      D.shop.items.filter((i) => hit(i.n) || i.c.some((c) => hit(c.t))).map((i) =>
        '<div class="grp"><h3>' + esc(i.n) + "</h3>" +
        '<p class="chosen">using <b>' + esc(i.ct) + "</b> at " + peso(i.cp) + " \\u00b7 " + i.c.length + " candidates</p>" +
        '<div class="scroll"><table class="listing"><thead><tr><th>Product</th><th>Type</th><th class="r">Price</th></tr></thead><tbody>' +
        i.c.map((c) => '<tr class="' + (c.t === i.ct ? "pick" : "") + '"><td>' + esc(c.t) +
          "</td><td>" + esc(c.y) + '</td><td class="r">' + peso(c.p) + "</td></tr>").join("") +
        "</tbody></table></div></div>").join("");

  // ── researched drafts ──────────────────────────────────
  const STATE = { ready: "ready now", wiring: "needs wiring only", blocked: "blocked" };
  const drafts = D.dr ? D.dr.d.filter((x) => hit(x.n) || x.i.some((g) => hit(g.n))) : [];
  document.getElementById("p-drafts").innerHTML = !D.dr
    ? '<div class="note">Not generated yet. Run scripts/draft-goods.mjs.</div>'
    : '<div class="note"><b>' + D.dr.c.total + " researched dishes</b>, none of them a duplicate of the 47 above. " +
        '<b class="ok">' + D.dr.c.ready + " could ship today.</b> " + D.dr.c.wiring +
        " need only wiring, meaning you already gave a price for the good and it was never put in the code. " +
        D.dr.c.blocked + " wait on a good nobody has priced. Ingredients in " +
        '<span class="need">orange</span> are the ones with no price.' +
        (D.dr.dupes.length ? " Also " + D.dr.dupes.length + " duplicate ids to merge: " + esc(D.dr.dupes.join(", ")) + "." : "") +
      "</div>" +
      drafts.map((x) => {
        // A dish missing a required price gets NO total, only its known lines.
        // The engine sums an unpriced ingredient as zero, and showing that
        // partial figure as the price is the Galunggong P0 bug.
        const head = x.t === null
          ? '<span class="chip ' + x.st + '">' + STATE[x.st] + "</span>"
          : '<span class="tot">' + peso(x.t) + "</span>";

        const rows = [
          ...x.i.map((g) => ({ n: g.n, a: g.a, c: g.c, o: g.o, need: g.s === "NEEDS" })),
          ...(x.pp || []).map((g) => ({ n: g.n, a: g.a, c: g.c, o: g.o, need: false })),
        ].map((g) =>
          '<tr class="' + (g.o ? "opt" : "") + '">' +
            '<td>' + esc(g.n) +
            (g.o ? ' <span class="count">optional</span>' : "") +
            (g.need ? ' <span class="need">walang presyo</span>' : "") + "</td>" +
            '<td class="amt">' + esc(g.a || "") + "</td>" +
            '<td class="num">' + (g.c === undefined || g.c === null ? "—" : peso(g.c)) + "</td>" +
          "</tr>"
        ).join("");

        return '<article class="rec"><div class="rec-head"><h3>' + esc(x.n) + "</h3>" +
          '<span class="serv">' + esc(x.pr) + " · " + esc(x.m) +
          (x.t === null ? "" : " · " + STATE[x.st]) + "</span>" +
          head + "</div>" +
          "<table>" + rows + "</table>" +
          (x.p && x.p.length
            ? '<p class="free"><span class="chip free">FREE</span> ' + esc(x.p.join(", ")) + "</p>"
            : "") +
          '<p class="src">' + esc(x.src || "") + "</p></article>";
      }).join("");

  // ── goods still to price ───────────────────────────────
  const goods = D.dr ? D.dr.g.filter((g) => hit(g.n) || g.ex.some((e) => hit(e))) : [];
  const section = (title, blurb, list) => !list.length ? "" :
    '<div class="grp"><h3>' + title + "</h3>" +
    '<p class="chosen">' + blurb + "</p>" +
    '<div class="scroll"><table class="listing"><thead><tr><th>Good</th><th class="r">Required in</th>' +
    '<th class="r">Optional in</th><th>Note / example dish</th></tr></thead><tbody>' +
    list.map((g) => "<tr><td>" + esc(g.n) +
      (g.sp ? ' <span class="count">also written: ' + esc(g.sp.slice(1).join(", ")) + "</span>" : "") +
      '</td><td class="r">' + g.r + '</td><td class="r">' + (g.o || "") + "</td><td>" +
      esc(g.d || g.ex.join(", ")) + "</td></tr>").join("") +
    "</tbody></table></div></div>";

  document.getElementById("p-goods").innerHTML = !D.dr
    ? '<div class="note">Not generated yet.</div>'
    : '<div class="note">A dish whose REQUIRED ingredient has no price is dropped silently by the engine, so it never appears at all. ' +
        "That makes this list the whole gate between the 203 researched dishes and shipping them.</div>" +
      section("Already priced by you, never wired",
        "You gave these prices but no live recipe used the good, so they only exist in my notes. Wiring them costs nothing.",
        goods.filter((g) => g.s === "notes")) +
      section("You have not priced these, and a dish REQUIRES them",
        "This is the real work queue, ordered by how many dishes each one unlocks.",
        goods.filter((g) => g.s === "NEEDS" && g.r > 0)) +
      section("Optional only",
        "Garnish and nice-to-have. Skip every one of these and no dish breaks.",
        goods.filter((g) => g.s === "NEEDS" && g.r === 0));

  const n = { recipes: recipes.length + " recipes", da: da.length + " rows", dti: dti.length + " entries",
              shop: (D.shop ? D.shop.items.length : 0) + " items",
              drafts: drafts.length + " dishes", goods: goods.length + " goods" }[tab];
  document.getElementById("count").textContent = n;
}

document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    tab = b.dataset.tab;
    document.querySelectorAll(".tabs button").forEach((o) => o.setAttribute("aria-selected", String(o === b)));
    ["recipes", "da", "dti", "shop", "drafts", "goods"].forEach((t) => {
      document.getElementById("p-" + t).hidden = t !== tab;
    });
    render();
  });
});
document.getElementById("q").addEventListener("input", (e) => { q = e.target.value; render(); });
render();
</script>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log("wrote " + outFile + "  (" + Math.round(html.length / 1024) + " KB)");
