#!/usr/bin/env python3
"""Borda tally of blind votes. 1st place = N-1 points ... last = 0. 'noself' drops a judge's vote for its own model."""
import json, glob, os
from collections import defaultdict
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base = lambda m: m.replace('-fair', '').replace('-r3', '')
res = {}
for st in ['plain', 'fair', 'ep7', 'equal']:
    tot, nos, wins, per = defaultdict(int), defaultdict(int), defaultdict(int), {}
    for d in sorted(glob.glob(f'{B}/judge/{st}-*')):
        task = d.split(f'/{st}-')[1]; per[task] = {}
        for vf in sorted(glob.glob(f'{d}/vote-*.json')):
            j = vf.split('vote-')[1][:-5]; v = json.load(open(vf)); n = len(v['models'])
            per[task][j] = v['models']
            wins[v['models'][0]] += 1
            for i, m in enumerate(v['models']):
                tot[m] += n - 1 - i
                if base(m) != j: nos[m] += n - 1 - i
    res[st] = {'total': dict(tot), 'noself': dict(nos), 'first_votes': dict(wins), 'votes': per}
    print(f'== {st}')
    for m in sorted(tot, key=lambda m: -tot[m]):
        print(f'  {m:11} total {tot[m]:3}  noself {nos[m]:3}  1st-votes {wins[m]}')
json.dump(res, open(f'{B}/tally.json', 'w'), ensure_ascii=False, indent=1)
print('tally.json written')
