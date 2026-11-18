#!/usr/bin/env python3
"""Collect everything the results site needs into ../site (data.json, results/, judge/, harness/). rec/ is made separately."""
import json, os, shutil, glob, csv, subprocess
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.dirname(B)
S = f'{L}/site'
F52 = '/Users/techkwon/Developer/MyApps/Youtube/fable52-lecture/samples/prompts'
os.makedirs(S, exist_ok=True)
subprocess.run(['python3', f'{B}/scripts/cost_table.py'], check=True, capture_output=True)
subprocess.run(['python3', f'{B}/scripts/tally.py'], check=True, capture_output=True)

MODELS = {
 'astra': {'name': 'GPT-6.2 Astra', 'maker': 'OpenAI', 'harness': 'Codex CLI 0.169, reasoning high, default Codex config (image tool, MCP, skills on)'},
 'sol': {'name': 'GPT-6.2 Sol', 'maker': 'OpenAI', 'harness': 'Codex CLI 0.169, reasoning high, default Codex config (image tool, MCP, skills on)'},
 'astra-fair': {'name': 'GPT-6.2 Astra (fair)', 'maker': 'OpenAI', 'harness': 'Codex CLI, reasoning high, image generation / apps / memories / web search off, user config ignored'},
 'sol-fair': {'name': 'GPT-6.2 Sol (fair)', 'maker': 'OpenAI', 'harness': 'Codex CLI, reasoning high, image generation / apps / memories / web search off, user config ignored'},
 'fable': {'name': 'Claude Fable 5.2', 'maker': 'Anthropic', 'harness': 'claude -p, effort high, tools Write/Edit/Read only, no settings/MCP'},
 'opus': {'name': 'Claude Opus 5.5', 'maker': 'Anthropic', 'harness': 'claude -p, effort high, tools Write/Edit/Read only, no settings/MCP'},
 'gpt61': {'name': 'GPT-6.1 Sol', 'maker': 'OpenAI', 'harness': 'ep.7 run (Codex CLI) reused from the Fable 5.2 video'},
}
SETS = {
 'plain': {'title': 'Round 1 - just use it', 'tasks': ['racing', 'pinball', 'colosseum', 'camper', 'deck'], 'models': ['astra', 'sol', 'fable', 'opus'],
           'note': 'GPT ran in Codex with the default setup, so it could call the built-in image generator (racing-astra and both camper sites used it).'},
 'fair': {'title': 'Round 2 - fair (GPT image tool off)', 'tasks': ['racing', 'pinball', 'colosseum', 'camper', 'deck'], 'models': ['astra-fair', 'sol-fair', 'fable', 'opus'],
          'note': 'GPT rerun with image generation, apps, memories, web search and user config off. Claude runs are the same as round 1.'},
 'ep7': {'title': 'Rematch - the 5 prompts from the Fable 5.2 video', 'tasks': ['motion', 'physics', 'svg', 'three', 'game'], 'models': ['astra', 'sol', 'fable', 'opus', 'gpt61'],
         'note': 'GPT-6.2 runs use the fair flags. Fable 5.2, Opus 5.5 and GPT-6.1 Sol outputs are the ones from the earlier video.'},
}
cost = {}
for r in csv.DictReader(open(f'{B}/cost_table.csv')):
    cost[(r['round'], r['task'], r['model'])] = r
tally = json.load(open(f'{B}/tally.json'))

def src(st, t, m):
    if st == 'plain': return f'{B}/runs/{t}/{m}'
    if st == 'fair': return f'{B}/runs-fair/{t}/{m.replace("-fair", "")}' if m.endswith('-fair') else f'{B}/runs/{t}/{m}'
    return os.path.realpath(f'{B}/runs/ep7-{t}/{m}')

def prompt(st, t):
    p = f'{F52}/{t}.txt' if st == 'ep7' else f'{B}/prompts/{t}.txt'
    return open(p).read().strip()

if os.path.isdir(f'{S}/results'): shutil.rmtree(f'{S}/results')
if os.path.isdir(f'{S}/judge'): shutil.rmtree(f'{S}/judge')
os.makedirs(f'{S}/judge')
data = {'title': 'GPT-6.2 Astra & Sol vs Claude Fable 5.2 & Opus 5.5', 'date': '2026-11-18', 'models': MODELS, 'sets': {}}
for st, info in SETS.items():
    tasks = []
    for t in info['tasks']:
        runs = []
        for m in info['models']:
            d = src(st, t, m); fn = 'index.svg' if os.path.exists(f'{d}/index.svg') else 'index.html'
            dst = f'{S}/results/{st}/{t}/{m}'; os.makedirs(dst, exist_ok=True)
            shutil.copy(f'{d}/{fn}', dst)
            c = cost.get((st, t, m)) or cost.get(('plain', t, m)) or {}
            rec = f'ep7-{t}-{m}.mp4' if st == 'ep7' else f'{t}-{m}.mp4'
            runs.append({'model': m, 'file': f'results/{st}/{t}/{m}/{fn}', 'video': f'rec/{rec}' if os.path.exists(f'{S}/rec/{rec}') else None,
                         'seconds': int(float(c['seconds'])) if c.get('seconds') else None,
                         'usd': float(c['usd']) if c.get('usd') else None, 'usage': c.get('note', '')})
        jd = f'{B}/judge/{st}-{t}'
        votes = {}
        if os.path.isdir(jd):
            shutil.copy(f'{jd}/sheet.jpg', f'{S}/judge/{st}-{t}.jpg')
            mp = json.load(open(f'{jd}/mapping.json'))
            for vf in sorted(glob.glob(f'{jd}/vote-*.json')):
                v = json.load(open(vf)); j = vf.split('vote-')[1][:-5]
                votes[j] = {'ranking': v['models'], 'reasons': {mp[k]: r for k, r in v.get('reasons', {}).items() if k in mp}}
            labels = mp
        else: labels = {}
        tasks.append({'id': t, 'prompt': prompt(st, t), 'runs': runs, 'sheet': f'judge/{st}-{t}.jpg', 'sheet_labels': labels, 'votes': votes})
    data['sets'][st] = {**info, 'tasks': tasks, 'tally': tally.get(st, {})}
    data['sets'][st].pop('votes', None)
    data['sets'][st]['tally'].pop('votes', None)
fl = [r for r in csv.DictReader(open(f'{B}/cost_table.csv')) if r['round'] == 'fable-limit-failed']
data['fable_limit_failed'] = {'note': 'Fable 5.2 hit the plan usage limit mid-run on camper and deck; those runs were thrown away and rerun after the reset.',
                              'usd': round(sum(float(r['usd'] or 0) for r in fl), 2)}
data['ultrafast'] = {'model': 'gpt-6.2-sol', 'prompt': 'Write a detailed 900-word essay about the history of the bicycle. Plain text only, no tools.',
  'rows': [{'tier': 'default', 'seconds': 68.7, 'tokens': 2261, 'tps': 33}, {'tier': 'Fast (priority)', 'seconds': 35.1, 'tokens': 2285, 'tps': 65},
           {'tier': 'Ultrafast', 'seconds': 20.0, 'tokens': 2202, 'tps': 110}, {'tier': 'bogus123 (control, rejected)', 'seconds': 71.2, 'tokens': 2468, 'tps': 35}],
  'note': 'codex-cli 0.169, reasoning low, one run each. Only gpt-6.2-sol lists the ultrafast tier. Usage multiplier not published.'}
data['official'] = {'url': 'https://openai.com/index/introducing-gpt-6-2-astra-sol/',
  'claims': ["Agents' Last Exam: Astra +5.5 over Fable 5.2 at about 5% of the cost", 'AA-3D Elo: Astra 1,318, Fable 5.2 1,271, Sol 1,259',
             'Harvey LAB-AA: more than double Fable pass rate at about 1/6 of the cost', 'FrontierCode: Sol within 0.5 of Astra at about 1/5 of the cost'],
  'prices_per_1M': {'gpt-6.2-astra': {'input': 8, 'cached': 0.4, 'output': 40}, 'gpt-6.2-sol': {'input': 2, 'cached': 0.1, 'output': 10}}}
data['method'] = [
 'Each model got the same prompt once (one shot, no follow-up). Prompts adapt the official example briefs; the ep.7 prompts are reused unchanged.',
 'GPT can run shell commands and test in a browser inside Codex; Claude was limited to Write/Edit/Read. This favours GPT and is the same setup as the earlier video.',
 'Every result was recorded in the same browser (Ego Lite, 1280x800) with the same scripted keyboard/mouse input for all models.',
 'Judges saw one image sheet per task with 6 frames per result, labels shuffled, model names hidden. The four contestants (Astra, Sol, Fable, Opus) judged; GPT-6.1 Sol did not.',
 'Score = Borda points (1st gets N-1 ... last 0). "noself" drops each judge\'s points for its own model.',
 'Cost: GPT from token usage x official API price; Claude from the CLI total_cost_usd. Time is wall clock.']
json.dump(data, open(f'{S}/data.json', 'w'), ensure_ascii=False, indent=1)
# harness
H = f'{S}/harness'; os.makedirs(H, exist_ok=True)
for f in ['run_one.sh', 'run_fair.sh', 'run_ep7.sh']: shutil.copy(f'{B}/{f}', H)
for f in glob.glob(f'{B}/scripts/*'):
    if os.path.isfile(f) and not f.endswith('.pyc'): shutil.copy(f, H)
os.makedirs(f'{S}/prompts', exist_ok=True)
for f in glob.glob(f'{B}/prompts/*.txt'): shutil.copy(f, f'{S}/prompts/')
print('bundle ok', sum(len(s['tasks']) for s in data['sets'].values()), 'tasks')
