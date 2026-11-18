#!/bin/zsh
# recompress recordings for the web, refresh posters (frame at 7 s, 1 s for 3 s svg clips), rebuild bundle + downloads
B=../gpt62-lecture
cd $B/site || exit 1
for f in $B/samples/rec/*.mp4; do b=$(basename $f)
  if [[ ! -f rec/$b || $f -nt rec/$b ]]; then ffmpeg -loglevel error -y -i $f -vf scale=960:600 -c:v libx264 -crf 28 -preset slow -an -movflags +faststart rec/$b; echo "rec $b"; fi
  ss=7; [[ $b == ep7-svg-* ]] && ss=1
  if [[ ! -f assets/posters/${b:r}.jpg || rec/$b -nt assets/posters/${b:r}.jpg ]]; then ffmpeg -loglevel error -y -ss $ss -i rec/$b -frames:v 1 -vf scale=800:-1 -q:v 4 assets/posters/${b:r}.jpg; fi
done
python3 $B/samples/scripts/build_bundle.py
