// Fetch and parse the newest DTI e-Presyo SRP bulletin.
//
//   node scripts/fetch-dti-srp.mjs            report to stdout
//   node scripts/fetch-dti-srp.mjs --json     also write data/dti-srp.json
//
// Reads the public S3 bucket listing to find the current bulletin, so no URL
// is hardcoded. Prints the effective date loudly: SRPs are a CEILING and this
// sheet is republished roughly once a year, so both facts have to travel with
// the numbers. See lib/dti-parser.ts for why the parser reads positions.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseSrpBulletin, newestBulletin } from "../lib/dti-parser.ts";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const BUCKET = "https://dtiwebfiles.s3.ap-southeast-1.amazonaws.com";
const PREFIX = "e-Presyo/SRP Basic Necessities and Prime Commodities/";

const encodeKey = (key) => key.split("/").map(encodeURIComponent).join("/");

async function listBucket(prefix) {
  let xml = "";
  let token = "";
  for (let page = 0; page < 20; page++) {
    const url =
      `${BUCKET}/?list-type=2&prefix=${encodeURIComponent(prefix)}` +
      (token ? `&continuation-token=${encodeURIComponent(token)}` : "");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`S3 listing returned HTTP ${res.status}`);
    const body = await res.text();
    xml += body;
    const next = body.match(/<NextContinuationToken>([^<]+)</);
    if (!next) break;
    token = next[1];
  }
  return xml;
}

/** Pull text runs with their x positions, in the order the PDF emits them. */
async function positionedItems(buffer) {
  const items = [];
  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const content = await pageData.getTextContent({ normalizeWhitespace: false });
      for (const item of content.items) {
        if (!item.str || !item.str.trim()) continue;
        items.push({ s: item.str, x: Math.round(item.transform[4]) });
      }
      return "";
    },
  });
  return items;
}

const bulletin = newestBulletin(await listBucket(PREFIX));
if (!bulletin) {
  console.error("No dated bulletin found in the DTI bucket. Layout or naming changed.");
  process.exit(1);
}

console.log("DTI e-Presyo — Basic Necessities and Prime Commodities");
console.log("  file:      " + bulletin.key.split("/").pop());
console.log("  effective: " + bulletin.effective);

const res = await fetch(`${BUCKET}/${encodeKey(bulletin.key)}`);
if (!res.ok) throw new Error(`Bulletin download returned HTTP ${res.status}`);
const buffer = Buffer.from(await res.arrayBuffer());

const records = parseSrpBulletin(await positionedItems(buffer));
const clean = records.filter((r) => !r.wrapped);
const unverified = records.filter((r) => r.wrapped);
console.log("  entries:   " + records.length + " (" + unverified.length + " with an unverified section)");

const bySection = new Map();
for (const r of clean) {
  const key = r.section || "(no section)";
  if (!bySection.has(key)) bySection.set(key, []);
  bySection.get(key).push(r);
}

console.log("");
for (const [section, rows] of bySection) {
  console.log(section);
  for (const r of rows.sort((a, b) => a.srp - b.srp)) {
    console.log(
      "   " + r.product.slice(0, 44).padEnd(46) + r.size.padEnd(9) + ("P" + r.srp.toFixed(2)).padStart(9)
    );
  }
}

// Wrapped cells are printed apart rather than filed under a heading that is
// probably wrong. Honest absence beats an invented category.
if (unverified.length) {
  console.log("");
  console.log("SECTION UNVERIFIED (label wrapped in the source layout)");
  for (const r of unverified.sort((a, b) => a.srp - b.srp)) {
    console.log(
      "   " + r.product.slice(0, 44).padEnd(46) + r.size.padEnd(9) + ("P" + r.srp.toFixed(2)).padStart(9)
    );
  }
}

if (process.argv.includes("--json")) {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "dti-srp.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        source: "DTI e-Presyo BNPC SRP Bulletin",
        note: "SRP is a price CEILING, not an observed shelf price.",
        file: bulletin.key,
        effective: bulletin.effective,
        records,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("");
  console.log("wrote " + path.relative(process.cwd(), out) + " (" + records.length + " records)");
}
