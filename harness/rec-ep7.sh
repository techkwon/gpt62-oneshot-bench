#!/bin/zsh
# usage: rec-ep7.sh <model...>  records ep.7 tasks (same ego-lite recorder and inputs for every model)
B=/Users/techkwon/Developer/MyApps/Youtube/gpt62-lecture/samples
for M in "$@"; do
  for T in motion physics three game; do
    [[ -f $B/rec/ep7-$T-$M.mp4 ]] && continue
    [[ -f $B/runs/ep7-$T/$M/index.html ]] || continue
    case $T in
      three) $B/scripts/rec-ego.sh ep7-$T $M 24 $B/scripts/act-ep7-three.json ;;
      game)  $B/scripts/rec-ego.sh ep7-$T $M 28 $B/scripts/act-ep7-game2.json ;;
      *)     $B/scripts/rec-ego.sh ep7-$T $M 18 $B/scripts/act-ep7-still.json ;;
    esac
    echo "REC ep7-$T $M"
  done
done
echo "REC-EP7 DONE $*"
