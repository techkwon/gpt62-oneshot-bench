#!/bin/zsh
# usage: rec-all.sh <model...>   records every finished task for those models that has no rec/<task>-<model>.mp4 yet
B=${BENCH_DIR:-.}
for M in "$@"; do
  for T in racing pinball colosseum camper deck; do
    [[ -f $B/rec/$T-$M.mp4 ]] && continue
    [[ -f $B/runs/$T/$M/index.html ]] || continue
    case $T in
      racing|pinball) $B/scripts/rec-ego.sh $T $M 30 $B/scripts/act-$T$( [[ $T == pinball || $T == colosseum ]] && echo 2 ).json ;;
      *)              $B/scripts/rec-ego.sh $T $M 28 $B/scripts/act-$T$( [[ $T == pinball || $T == colosseum ]] && echo 2 ).json ;;
    esac
    echo "REC $T $M"
  done
done
echo "REC-ALL DONE $*"
