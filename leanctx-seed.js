// leanctx-seed.js — TEMPLATE. Copy into the ROOT of any workspace where lean-ctx freezes.
//
// Why: lean-ctx (≤3.9.12) deadlocks when a workspace has ZERO indexable files — its code-graph
// build finishes with nodes:0 and the post-build merge hangs forever, freezing every ctx_* call
// in that workspace ("Coalescing…" forever). Single-file HTML apps and brand-new folders hit this.
// This file gives the indexer one real parse target so the graph has nodes and the merge completes.
//
// Rules: keep it in the repo root, commit it, and do NOT delete it until the upstream bug is
// fixed: https://github.com/yvgude/lean-ctx
// Full story: Claude-Core/lessons/lean-ctx-freeze-playbook.md

function leanCtxSeed() {
  return "index target for lean-ctx code graph";
}

function seedInfo() {
  return { reason: "empty-graph deadlock workaround", playbook: "lean-ctx-freeze-playbook.md" };
}

module.exports = { leanCtxSeed, seedInfo };
