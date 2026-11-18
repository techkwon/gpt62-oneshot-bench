#!/bin/zsh
# usage: run_ep7.sh <astra|sol> <task: motion|physics|svg|three|game> <workdir>
# ep.7 (Fable 5.2 test) prompts, unchanged, run on GPT-6.2 via codex exec -> runs-ep7/<task>/<model>
M=$1; T=$2
P7=/Users/techkwon/Developer/MyApps/Youtube/fable52-lecture/samples/prompts
BASE=/Users/techkwon/Developer/MyApps/Youtube/gpt62-lecture/samples
WORK="$3/ep7/$T/$M"; mkdir -p "$WORK"; cd "$WORK"
[[ $M == astra ]] && GM=gpt-6.2-astra || GM=gpt-6.2-sol
START=$(date +%s)
env -i HOME=$HOME PATH=$PATH codex exec --skip-git-repo-check --ignore-user-config --ignore-rules --disable image_generation --disable apps --disable memories -c web_search="disabled" -s workspace-write -C . -m $GM -c model_reasoning_effort=high --json -o last.txt "$(cat $P7/$T.txt)" < /dev/null > log.jsonl 2> err.txt
RC=$?; END=$(date +%s)
echo "{\"model\":\"$M\",\"task\":\"$T\",\"seconds\":$((END-START)),\"rc\":$RC}" > meta.json
OUT=$BASE/runs-ep7/$T/$M; mkdir -p $OUT; cp -f index.html index.svg meta.json log.jsonl last.txt err.txt $OUT/ 2>/dev/null
echo "done $M $T rc=$RC $((END-START))s $(ls $OUT | tr '\n' ' ')"
