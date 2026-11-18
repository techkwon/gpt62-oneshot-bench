#!/bin/zsh
# usage: run_fair.sh (GPT only, image generation off, user config ignored) <model: astra|sol|fable|opus> <task> <workdir>
M=$1; T=$2
BASE=${BENCH_DIR:-.}
WORK="$3/fair/$T/$M"; mkdir -p "$WORK"; cd "$WORK"
PROMPT="$(cat $BASE/prompts/$T.txt)"
START=$(date +%s)
case $M in
  astra) GM=gpt-6.2-astra;; sol) GM=gpt-6.2-sol;;
  fable) CM=claude-fable-5-2;; opus) CM=claude-opus-5-5;;
esac
if [[ -n $GM ]]; then
  env -i HOME=$HOME PATH=$PATH codex exec --skip-git-repo-check --ignore-user-config --ignore-rules --disable image_generation --disable apps --disable memories -c web_search="disabled" -s workspace-write -C . -m $GM -c model_reasoning_effort=high --json -o last.txt "$PROMPT" < /dev/null > log.jsonl 2> err.txt
else
  env -i HOME=$HOME PATH=$PATH USER=$USER claude -p "$PROMPT" --model $CM --effort high --setting-sources "" --strict-mcp-config --permission-mode acceptEdits --allowedTools "Write,Edit,Read" --output-format json > log.json 2> err.txt
fi
RC=$?
END=$(date +%s)
echo "{\"model\":\"$M\",\"task\":\"$T\",\"seconds\":$((END-START)),\"rc\":$RC}" > meta.json
OUT=$BASE/runs-fair/$T/$M; mkdir -p $OUT; cp -f index.html meta.json log.json log.jsonl last.txt err.txt $OUT/ 2>/dev/null
echo "done $M $T rc=$RC $((END-START))s $(ls $OUT | tr '\n' ' ')"
