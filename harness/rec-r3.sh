#!/bin/zsh
# usage: rec-r3.sh <task...>  records round-3 Claude results (fable-r3, opus-r3) with the same recorder/actions as round 1-2
B=${BENCH_DIR:-.}
for T in "$@"; do for M in fable opus; do
  [[ -f $B/runs-r3/$T/$M/index.html ]] || { echo "missing $T/$M"; continue; }
  [[ -e $B/runs/$T/$M-r3 ]] || ln -s $B/runs-r3/$T/$M $B/runs/$T/$M-r3
  [[ -f $B/rec/$T-$M-r3.mp4 ]] && continue
  case $T in
    racing|pinball) $B/scripts/rec-ego.sh $T $M-r3 30 $B/scripts/act-$T$( [[ $T == pinball ]] && echo 2 ).json ;;
    *)              $B/scripts/rec-ego.sh $T $M-r3 28 $B/scripts/act-$T$( [[ $T == colosseum ]] && echo 2 ).json ;;
  esac
  echo "REC $T $M-r3"
done; done
