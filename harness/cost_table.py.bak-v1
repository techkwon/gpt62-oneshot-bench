#!/usr/bin/env python3
"""Cost & time table for every run.  GPT: codex --json turn.completed usage x official price.
Claude: total_cost_usd from claude -p log.json.  Seconds from meta.json (wall clock)."""
import json, os, glob, csv, sys
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRICE = {"astra": (8.00, 0.40, 40.00), "sol": (2.00, 0.10, 10.00), "gpt61": (2.00, 0.10, 10.00)}

def gpt_cost(d, m):
    u = None
    p = os.path.join(d, "log.jsonl")
    if not os.path.exists(p): return None, None
    for line in open(p, encoding="utf8", errors="ignore"):
        if '"turn.completed"' in line:
            try: u = json.loads(line)["usage"]
            except Exception: pass
    if not u: return None, None
    pi, pc, po = PRICE[m]
    inp, cached, out = u["input_tokens"], u.get("cached_input_tokens", 0), u["output_tokens"]
    usd = ((inp - cached) * pi + cached * pc + out * po) / 1e6
    return usd, f"in {inp:,} (cached {cached:,}) out {out:,}"

def claude_cost(d):
    p = os.path.join(d, "log.json")
    if not os.path.exists(p) or os.path.getsize(p) == 0: return None, None
    j = json.load(open(p))
    u = j.get("usage", {})
    return j.get("total_cost_usd"), f"out {u.get('output_tokens', 0):,} turns {j.get('num_turns')}"

def secs(d):
    p = os.path.join(d, "meta.json")
    if os.path.exists(p):
        j = json.load(open(p)); return j.get("seconds"), j.get("rc")
    p = os.path.join(d, "log.json")
    if os.path.exists(p) and os.path.getsize(p):
        return round(json.load(open(p)).get("duration_ms", 0) / 1000), 0
    return None, None

rows = []
def add(round_, task, label, d):
    base = label.replace("-fair", "")
    if not os.path.isdir(d): return
    usd, note = (gpt_cost(d, base) if base in PRICE else claude_cost(d))
    s, rc = secs(d)
    ok = os.path.exists(os.path.join(d, "index.html")) or os.path.exists(os.path.join(d, "index.svg"))
    rows.append(dict(round=round_, task=task, model=label, seconds=s, rc=rc, ok=ok,
                     usd=None if usd is None else round(usd, 3), note=note or ""))

for t in ["racing", "pinball", "colosseum", "camper", "deck"]:
    for m in ["astra", "sol", "fable", "opus"]:
        add("plain", t, m, f"{B}/runs/{t}/{m}")
    for m in ["astra", "sol"]:
        add("fair", t, m + "-fair", f"{B}/runs-fair/{t}/{m}")
    add("fable-limit-failed", t, "fable", f"{B}/runs-fable-limit/{t}")
for t in ["motion", "physics", "svg", "three", "game"]:
    for m in ["astra", "sol", "fable", "opus", "gpt61"]:
        add("ep7", t, m, os.path.realpath(f"{B}/runs/ep7-{t}/{m}"))

out = f"{B}/cost_table.csv"
with open(out, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
# summary per round x model
from collections import defaultdict
agg = defaultdict(lambda: [0.0, 0, 0])
for r in rows:
    k = (r["round"], r["model"]); a = agg[k]
    a[0] += r["usd"] or 0; a[1] += r["seconds"] or 0; a[2] += 1
print(f"{'round':20} {'model':11} {'runs':>4} {'USD':>8} {'min':>6}")
for (rd, m), (usd, s, n) in sorted(agg.items()):
    print(f"{rd:20} {m:11} {n:4} {usd:8.2f} {s/60:6.1f}")
print("csv:", out)
