import { roundNames as roundLabels, taskNames as taskLabels } from './evidence.js';

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function money(value) {
  return Number.isFinite(value) ? '$' + value.toLocaleString('ko-KR', {
    minimumFractionDigits: 2, maximumFractionDigits: 3,
  }) : '기록 없음';
}

function duration(seconds) {
  if (!Number.isFinite(seconds)) return '기록 없음';
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}분 ${seconds % 60}초` : `${seconds}초`;
}

function section(id, title, content) {
  return `<section class="lower-section" id="${id}" aria-labelledby="${id}-heading"><div class="wrap">
    <header class="section-heading"><h2 id="${id}-heading">${title}</h2></header>${content}
  </div></section>`;
}

function table(label, headers, body) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escape(label)}">
    <table aria-label="${escape(label)}"><thead><tr>${headers.map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead>${body}</table></div>`;
}

function costSection(data) {
  const intro = '<p>라운드를 펼치면 과제마다 결과가 나오기까지 걸린 시간과 비용을 볼 수 있어요. 금액은 미국 달러 기준이에요.</p>';
  const reuseNotes = {
    fair: 'Claude는 첫 라운드 결과를 그대로 심사했어요. 표에 다시 적은 시간과 비용은 첫 실행의 기록이에요.',
    ep7: 'Claude Fable 5.2, Claude Opus 5.5, GPT-6.1 Sol은 이전 강의에서 사용한 결과와 실행 기록을 가져왔어요.',
  };
  const tables = Object.entries(data.sets).map(([key, round]) => {
    const body = round.tasks.map(task => `<tbody>${task.runs.map((run, index) => {
      const taskHeading = index === 0 ? `<th scope="rowgroup" rowspan="${task.runs.length}">${taskLabels[task.id]}</th>` : '';
      return `<tr>${taskHeading}<th scope="row">${escape(data.models[run.model].name.replace(' (fair)', ''))}</th>
        <td>${duration(run.seconds)}</td><td>${money(run.usd)}</td></tr>`;
    }).join('')}</tbody>`).join('');
    const reuse = reuseNotes[key] ? `<p>${reuseNotes[key]}</p>` : '';
    return `<details class="record-fold"><summary>${roundLabels[key]}</summary>${reuse}
      ${table(roundLabels[key] + ' 실행 기록', ['과제', '모델', '소요 시간', '비용'], body)}</details>`;
  }).join('');
  const failed = `<aside class="note"><strong>사용량 한도로 중단된 실행</strong><p>Claude Fable 5.2는 캠핑카 웹사이트와 동아리 굿즈 발표 자료를 만드는 도중 요금제 한도에 도달했어요. 한도가 초기화된 뒤 다시 실행한 결과를 심사했어요. 중단된 실행에 든 ${money(data.fable_limit_failed.usd)}는 위 표에서 제외했어요.</p></aside>`;
  return section('costs', '실행 비용과 시간', intro + tables + failed);
}

function speedSection({ ultrafast }) {
  const names = {
    default: '기본', 'Fast (priority)': '고속 (우선 처리)', Ultrafast: '초고속',
    'bogus123 (control, rejected)': '잘못된 설정 (대조군)',
  };
  const body = '<tbody>' + ultrafast.rows.map(row => `<tr><th scope="row">${names[row.tier]}</th>
    <td>${row.seconds}초</td><td>${row.tokens.toLocaleString('ko-KR')}</td><td>${row.tps}</td></tr>`).join('') + '</tbody>';
  const version = ultrafast.note.match(/codex-cli ([\d.]+)/i)[1];
  const settings = `<p class="note">Codex CLI ${escape(version)}에서 추론 강도를 낮게 두고 설정마다 한 번씩 측정했어요. 대조군에는 잘못된 설정값을 넣었고, 해당 값은 거부됐어요. 초고속 설정은 Sol에서만 제공되며 사용량 차감 배수는 공개되지 않았어요.</p>`;
  return section('speed', 'Sol 초고속 모드', `<p>같은 모델에 자전거의 역사를 써 달라고 했어요. 도구 없이 글을 쓸 때 속도 설정에 따라 얼마나 달라질까요?</p>
    ${table('GPT-6.2 Sol 속도 설정별 측정 결과', ['속도 설정', '소요 시간', '출력 토큰', '초당 토큰'], body)}
    ${settings}<details class="record-fold"><summary>속도 실험 프롬프트</summary><p lang="en">${escape(ultrafast.prompt)}</p></details>`);
}

// Keep each translation attached to the exact statement it describes.
const claimTranslations = new Map([
  ["Astra +5.5 over Fable 5.2 at about 5% of the cost",
    "Astra는 Fable 5.2보다 5.5점 높았고, 비용은 Fable의 약 5%였어요."],
  ["Astra 1,318, Fable 5.2 1,271, Sol 1,259",
    "Astra는 1,318점, Fable 5.2는 1,271점, Sol은 1,259점이었어요."],
  ["more than double Fable pass rate at about 1/6 of the cost",
    "통과율은 Fable의 두 배를 넘었고, 비용은 Fable의 약 1/6이었어요."],
  ["Sol within 0.5 of Astra at about 1/5 of the cost",
    "Sol과 Astra의 점수 차이는 0.5점 이내였고, Sol의 비용은 Astra의 약 1/5이었어요."],
]);

function officialClaim(claim) {
  const [name, description] = claim.split(': ');
  return `<li><strong>${escape(name)}</strong><p>${escape(claimTranslations.get(description) || description)}</p></li>`;
}

function officialSection(data) {
  const observed = Object.entries(data.sets).map(([key, round]) => {
    const [model, points] = Object.entries(round.tally.total).sort((a, b) => b[1] - a[1])[0];
    const runs = round.tasks.flatMap(task => task.runs.filter(run => run.model === model));
    const cost = runs.every(run => Number.isFinite(run.usd)) ? money(runs.reduce((sum, run) => sum + run.usd, 0)) : '기록 없음';
    return `<li><strong>${roundLabels[key]}</strong><p>${escape(data.models[model].name.replace(' (fair)', ''))}의 보르다 총점이 ${points}점으로 가장 높았어요. 이 모델의 과제 비용 합계는 ${cost}예요.</p></li>`;
  }).join('');
  const priceRows = Object.entries(data.official.prices_per_1M).map(([id, price]) => {
    const model = Object.values(data.models).find(item => item.name.toLowerCase().replaceAll(' ', '-') === id);
    return `<tr><th scope="row">${escape(model?.name || id)}</th><td>${money(price.input)}</td><td>${money(price.cached)}</td><td>${money(price.output)}</td></tr>`;
  }).join('');
  return section('official', '공식 발표와 실험 결과', `<p>OpenAI는 여러 벤치마크의 점수를 발표했어요. 이번 강의에서는 직접 만든 결과물을 블라인드로 평가했기 때문에 두 점수를 직접 비교할 수는 없어요.</p>
    <div class="records-grid"><article><h3>OpenAI 발표</h3><ul class="records-list">${data.official.claims.map(officialClaim).join('')}</ul></article>
    <article><h3>이번 실험</h3><ul class="records-list">${observed}</ul></article></div>
    <details class="record-fold"><summary>공식 API 가격 · 백만 토큰당</summary>${table('백만 토큰당 공식 API 가격 (미국 달러)', ['모델', '입력', '캐시 입력', '출력'], '<tbody>' + priceRows + '</tbody>')}</details>
    <p><a href="${escape(data.official.url)}">OpenAI 공식 발표 읽기 ↗</a></p>`);
}

const methodTranslations = new Map([
  ["Each model got the same prompt once (one shot, no follow-up). Prompts adapt the official example briefs; the ep.7 prompts are reused unchanged.",
    ['과제 제시', '각 모델에 같은 프롬프트를 한 번만 주었고, 추가 요청은 하지 않았어요. 공식 예시를 바탕으로 과제를 만들었고, 재대결에서는 이전 강의의 프롬프트를 그대로 사용했어요.']],
  ["GPT can run shell commands and test in a browser inside Codex; Claude was limited to Write/Edit/Read. This favours GPT and is the same setup as the earlier video.",
    ['도구 사용 조건', 'GPT는 Codex에서 명령어를 실행하고 브라우저로 스스로 테스트할 수 있었어요. Claude는 파일을 쓰고 고치고 읽는 도구(Write/Edit/Read)만 쓸 수 있었어요. 이전 강의와 같은 조건이며 GPT에 유리한 차이예요.']],
  ["Every result was recorded in the same browser (Ego Lite, 1280x800) with the same scripted keyboard/mouse input for all models.",
    ['화면 녹화', '모든 결과를 같은 브라우저(Ego Lite)에서 1280 × 800 화면으로 녹화했어요. 같은 과제에는 동일한 순서로 키보드와 마우스를 조작했어요.']],
  ["Judges saw one image sheet per task with 6 frames per result, labels shuffled, model names hidden. The four contestants (Astra, Sol, Fable, Opus) judged; GPT-6.1 Sol did not.",
    ['블라인드 심사', '결과물마다 여섯 장면을 추려 과제별로 한 장의 심사 시트에 담았어요. 모델 이름을 가리고 글자 순서를 섞은 뒤 Astra, Sol, Fable, Opus가 심사했어요. GPT-6.1 Sol은 심사에 참여하지 않았어요.']],
  ["Score = Borda points (1st gets N-1 ... last 0). \"noself\" drops each judge's points for its own model.",
    ['점수 계산', '보르다 점수는 한 모델보다 낮은 순위를 받은 모델의 수예요. 최하위는 0점을 받고, 순위가 한 단계 높아질 때마다 1점씩 더 받아요. 자기표 제외 점수는 심사 모델이 자기 결과물에 준 점수만 뺀 값이에요.']],
  ["Cost: GPT from token usage x official API price; Claude from the CLI total_cost_usd. Time is wall clock.",
    ['비용과 시간', 'GPT 비용은 토큰 사용량에 공식 API 단가를 곱해 계산했고, Claude 비용은 실행 도구가 보고한 총액을 사용했어요. 소요 시간은 시작부터 종료까지 실제로 흐른 시간이에요.']],
]);

function methodSection(data) {
  return section('method', '실험 방법', `<dl class="method-list">${data.method.map(statement => {
    const [term, explanation] = methodTranslations.get(statement) || ['실험 조건', statement];
    return `<div><dt>${escape(term)}</dt><dd>${escape(explanation)}</dd></div>`;
  }).join('')}</dl>`);
}

function downloadsSection(data) {
  const items = data.downloads.map(item => `<li><a href="${escape(item.href)}" download><strong>${escape(item.title)}</strong><span>${escape(item.detail)}${item.size ? ` · ${escape(item.size)}` : ''}</span><b aria-hidden="true">↓</b></a></li>`).join('');
  return section('downloads', '원본 자료 받기', `<p>이 페이지의 모든 결과물, 녹화 영상, 심사 시트와 투표 원문, 실행 스크립트를 그대로 내려받을 수 있어요. 결과물 파일은 모델이 만든 그대로이고 손대지 않았어요.</p><ul class="download-list">${items}</ul><p class="records-links"><a href="${escape(data.repo)}" target="_blank" rel="noopener noreferrer">GitHub 저장소 열기 ↗</a> <a href="harness/tally.py" download>점수 집계 코드 ↓</a> <a href="harness/cost_table.py" download>비용 계산 코드 ↓</a></p>`);
}

export function renderRecords(data) {
  return costSection(data) + speedSection(data) + officialSection(data) + methodSection(data) + downloadsSection(data);
}
