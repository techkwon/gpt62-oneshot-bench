#!/bin/zsh
# usage: judge.sh <set: plain|fair|ep7> <task> <judge: astra|sol|fable|opus>  -> judge/<set>-<task>/vote-<judge>.json
B=/Users/techkwon/Developer/MyApps/Youtube/gpt62-lecture/samples
S=$1; T=$2; J=$3; D=$B/judge/$S-$T
if [[ $S == ep7 ]]; then PF=/Users/techkwon/Developer/MyApps/Youtube/fable52-lecture/samples/prompts/$T.txt; else PF=$B/prompts/$T.txt; fi
P="$(sed -n '1,/^$/p' $PF | sed '/^$/d')"
N=$(python3 -c "import json;print(len(json.load(open('$D/mapping.json'))))")
LABS=$(python3 -c "print(', '.join('ABCDE'[:$N]))")
WORDS=(zero one two three four five)
if [[ $T == svg ]]; then SHOW="Each row shows one submission's rendered SVG image."; else SHOW="For animated or interactive results the row is a sequence of frames captured from the running page at even time intervals, left to right (interactive ones were played with the same scripted keyboard/mouse input)."; fi
EX=$(python3 -c "L='ABCDE'[:$N];import json;print(json.dumps({'ranking':['<'+str(i+1)+'>' for i in range($N)],'reasons':{x:'...' for x in L}}))")
Q="You are an impartial judge. ${(C)WORDS[$((N+1))]} anonymous submissions ($LABS) were each produced in one shot from this exact prompt:

\"\"\"$P\"\"\"

The image sheet.jpg in the current directory shows each submission as one row labelled $LABS. $SHOW Open and look at sheet.jpg.

Judge only what you can see, on three criteria: (1) how well it fulfils the prompt, (2) visual quality and polish, (3) correctness - no visible bugs such as clipping, overflow, broken layout, or objects escaping. Rank all ${WORDS[$((N+1))]} from best to worst; no ties.

Reply with ONLY a JSON object, no markdown, shaped like $EX where ranking lists the labels best first and each reason is one short Korean sentence."
cd $D || exit 1
if [[ $J == astra || $J == sol ]]; then
  [[ $J == astra ]] && GM=gpt-6.2-astra || GM=gpt-6.2-sol
  env -i HOME=$HOME PATH=$PATH codex exec --skip-git-repo-check --ignore-user-config --ignore-rules --disable image_generation --disable apps --disable memories -c web_search="disabled" -s read-only -C . -m $GM -c model_reasoning_effort=high -i sheet.jpg -o raw-$J.txt "$Q" < /dev/null > /dev/null 2>&1
else
  [[ $J == opus ]] && MODEL=claude-opus-5-5 || MODEL=claude-fable-5-2
  env -i HOME=$HOME PATH=$PATH USER=$USER claude -p "$Q" --model $MODEL --effort high --setting-sources "" --strict-mcp-config --allowedTools "Read" --output-format json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin).get('result',''))" > raw-$J.txt
fi
python3 - "$D" "$J" <<'PY'
import sys,json
d,j=sys.argv[1:3]; raw=open(f'{d}/raw-{j}.txt').read()
mp=json.load(open(f'{d}/mapping.json')); L=sorted(mp)
# take the LAST valid JSON object with a full ranking (a judge may self-correct after a broken first attempt)
v=None; dec=json.JSONDecoder()
for i in [k for k,c in enumerate(raw) if c=='{']:
    try: o,_=dec.raw_decode(raw[i:])
    except Exception: continue
    if isinstance(o,dict) and isinstance(o.get('ranking'),list) and sorted(o['ranking'])==L: v=o
if v is None:
    # fallback: a reason string broke the JSON (e.g. an unescaped quote); take the ranking array and the reasons we can read
    import re
    m=re.search(r'"ranking"\s*:\s*\[([^\]]*)\]',raw)
    r=re.findall(r'"([A-E])"',m.group(1)) if m else []
    if sorted(r)!=L: raise SystemExit(f'no valid vote in raw {d} {j}')
    v={'ranking':r,'reasons':{x:y for x,y in re.findall(r'"([A-E])"\s*:\s*"((?:[^"\\]|\\.)*)"',raw)},'parse':'fallback'}
v['models']=[mp[x] for x in v['ranking']]
json.dump(v,open(f'{d}/vote-{j}.json','w'),ensure_ascii=False,indent=1); print(d.split('/')[-1],j,v['ranking'],v['models'])
PY
