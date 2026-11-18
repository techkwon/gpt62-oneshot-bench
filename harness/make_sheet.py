#!/usr/bin/env python3
# usage: make_sheet.py <set: plain|fair|ep7> <task> [n_frames] -> judge/<set>-<task>/sheet.jpg + mapping.json
# labels shuffled, seeded by set+task. plain: 6.2 Astra/Sol vs Fable 5.2/Opus 5.5; fair: same with GPT image tool off; ep7: ep.7 prompts, 5 models.
import sys, os, json, random, subprocess
from PIL import Image, ImageDraw, ImageFont
B = '/Users/techkwon/Developer/MyApps/Youtube/gpt62-lecture/samples'
st, task = sys.argv[1], sys.argv[2]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 6
models = {'plain': ['astra', 'sol', 'fable', 'opus'], 'fair': ['astra-fair', 'sol-fair', 'fable', 'opus'],
          'ep7': ['astra', 'sol', 'fable', 'opus', 'gpt61']}[st]
rec = (lambda m: f'{B}/rec/ep7-{task}-{m}.mp4') if st == 'ep7' else (lambda m: f'{B}/rec/{task}-{m}.mp4')
rnd = random.Random(f'gpt62-{st}-{task}'); order = models[:]; rnd.shuffle(order)
LAB = 'ABCDE'[:len(order)]
out = f'{B}/judge/{st}-{task}'; os.makedirs(out, exist_ok=True)
FW, FH = 640, 400
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 64)
rows = []
for lab, m in zip(LAB, order):
    mp4 = rec(m)
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]))
    static = task == 'svg'
    k = 1 if static else n
    row = Image.new('RGB', (110 + FW * n, FH), (20, 20, 20))
    for i in range(k):
        t = dur * (i + 0.5) / k
        tmp = f'{out}/_f.png'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={FW*2 if static else FW}:{FH*2 if static else FH}', tmp], check=True)
        im = Image.open(tmp).convert('RGB')
        row.paste(im, (110 + FW * i, 0))
    if static:
        row = Image.new('RGB', (110 + FW * 2, FH * 2), (20, 20, 20)); row.paste(im, (110, 0))
    ImageDraw.Draw(row).text((28, row.height // 2 - 36), lab, fill=(255, 255, 255), font=font)
    rows.append(row)
W = max(r.width for r in rows); H = sum(r.height for r in rows) + 8 * (len(rows) - 1)
sheet = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height + 8
if sheet.width > 2600: sheet = sheet.resize((2600, round(sheet.height * 2600 / sheet.width)), Image.LANCZOS)
sheet.save(f'{out}/sheet.jpg', quality=90)
json.dump(dict(zip(LAB, order)), open(f'{out}/mapping.json', 'w'))
os.remove(f'{out}/_f.png'); print(st, task, sheet.size)
