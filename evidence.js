export const roundNames = {
  plain: "1라운드 · 기본 설정",
  fair: "2라운드 · 이미지 생성 끄기",
  ep7: "재대결 · 이전 강의 과제"
};

export const taskNames = {
  racing: "네온 도시 레이싱",
  pinball: "핀볼 게임",
  colosseum: "로마 콜로세움",
  camper: "캠핑카 웹사이트",
  deck: "동아리 굿즈 발표 자료",
  motion: "모션 그래픽",
  physics: "회전하는 육각형",
  svg: "자전거 타는 펠리컨",
  three: "농구 자유투",
  game: "추격 생존 게임"
};

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = value => String(value).replace(/[&<>"']/g, char => entities[char]);
const baseModel = id => id.replace(/-fair$/, "");

function elapsed(seconds) {
  if (!Number.isFinite(seconds)) return "기록 없음";
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}분 ${seconds % 60}초` : `${seconds}초`;
}

function cost(value) {
  return Number.isFinite(value) ? `$${value}` : "기록 없음";
}

export function initEvidence(data) {
  const root = document.getElementById("evidence");
  const modelName = id => data.models[baseModel(id)]?.name || data.models[id]?.name || id;
  const shortRoundNames = {plain:"기본 설정", fair:"이미지 생성 끔", ep7:"이전 과제 재대결"};
  const option = (id, label) => `<option value="${esc(id)}">${esc(label)}</option>`;

  root.setAttribute("aria-labelledby", "ev-heading");
  root.innerHTML = `<div class="wrap ev-inner">
    <div class="ev-heading-row">
      <div>
        <h2 id="ev-heading">과제별 결과 보기</h2>
        <p>같은 과제를 받은 모델들의 녹화 영상과 심사 의견을 살펴보세요.</p>
      </div>
      <div class="ev-filters">
        <label>라운드<select id="ev-round">${Object.keys(data.sets).map(k => option(k, shortRoundNames[k])).join("")}</select></label>
        <label>과제<select id="ev-task"></select></label>
      </div>
    </div>
    <div class="ev-workspace">
      <div class="ev-media" id="ev-media"></div>
      <div class="ev-models">
        <h3>모델별 녹화 영상</h3>
        <div class="ev-model-list" id="ev-model-list" role="group" aria-label="녹화 영상 선택"></div>
      </div>
    </div>
    <div class="ev-disclosures" id="ev-disclosures"></div>
    <p class="ev-sr" role="status" id="ev-status"></p>
  </div>`;

  const roundSelect = root.querySelector("#ev-round");
  const taskSelect = root.querySelector("#ev-task");
  const list = root.querySelector("#ev-model-list");
  const viewer = root.querySelector("#ev-media");
  const archive = root.querySelector("#ev-disclosures");
  const status = root.querySelector("#ev-status");
  let task;
  let currentRound;
  let currentModel;

  function showRun(modelId) {
    const run = task.runs.find(item => item.model === modelId) ||
      task.runs.find(item => baseModel(item.model) === baseModel(modelId || "")) || task.runs[0];
    currentModel = run.model;
    const title = `${taskNames[task.id]} · ${modelName(run.model)}`;
    const poster = `assets/posters/${run.video.split("/").at(-1).replace(/\.mp4$/, ".jpg")}`;
    viewer.querySelector("video")?.pause();
    viewer.innerHTML = `<video aria-label="${esc(title)} 실행 녹화" controls muted playsinline preload="none" poster="${esc(poster)}" src="${esc(run.video)}"></video>
      <div class="ev-caption">
        <div><h3>${esc(taskNames[task.id])}</h3><span>${esc(modelName(run.model))}</span></div>
        <a href="${esc(run.file)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(title)} 결과물 열기 (새 창)">결과물 열기 <span aria-hidden="true">↗</span></a>
      </div>`;
    list.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.model === currentModel));
    });
    status.textContent = `${roundNames[currentRound]}, ${title} 녹화 영상을 선택했어요.`;
  }

  function renderArchive() {
    const votes = Object.entries(task.votes).map(([judge, vote]) =>
      `<details class="ev-ballot">
        <summary>${esc(modelName(judge))}의 투표</summary>
        <ol class="ev-ranks">${vote.ranking.map((id, index) => `<li>
          <span class="ev-rank">${index + 1}위</span>
          <div><strong>${esc(modelName(id))}</strong><p>${esc(vote.reasons[id])}</p></div>
        </li>`).join("")}</ol>
      </details>`
    ).join("");
    const mapping = Object.entries(task.sheet_labels).map(([letter, id]) =>
      `<div><dt>${esc(letter)}</dt><dd>${esc(modelName(id))}</dd></div>`).join("");
    archive.innerHTML = `<details><summary>과제 프롬프트 원문</summary>
      <pre class="ev-prompt" lang="en">${esc(task.prompt)}</pre></details>
      <details class="ev-sheet"><summary>블라인드 심사표</summary>
        <div class="ev-sheet-content"><p>심사 모델들이 본 화면이에요. 글자별로 결과물을 먼저 비교해 보세요.</p>
          <a class="ev-sheet-link" href="${esc(task.sheet)}" target="_blank" rel="noopener noreferrer">심사표 원본 크게 보기 <span aria-hidden="true">↗</span><span class="ev-sr"> (새 창)</span></a>
          <img loading="lazy" data-src="${esc(task.sheet)}" alt="${esc(taskNames[task.id])} 과제의 모델명을 가린 심사표">
          <details class="ev-key"><summary>글자별 모델 공개</summary><dl>${mapping}</dl></details>
        </div>
      </details>
      <details><summary>심사 모델별 순위와 이유</summary><div class="ev-ballots">${votes}</div></details>`;
    const sheet = archive.querySelector(".ev-sheet");
    sheet.addEventListener("toggle", () => {
      if (sheet.open) {
        const image = sheet.querySelector("img[data-src]");
        if (image) {
          image.src = image.dataset.src;
          image.removeAttribute("data-src");
        }
      }
    });
  }

  function selectEvidence(round, taskId, model) {
    currentRound = Object.hasOwn(data.sets, round) ? round : Object.keys(data.sets)[0];
    const tasks = data.sets[currentRound].tasks;
    task = tasks.find(item => item.id === taskId) || tasks[0];
    roundSelect.value = currentRound;
    taskSelect.innerHTML = tasks.map(item => option(item.id, taskNames[item.id])).join("");
    taskSelect.value = task.id;
    list.innerHTML = task.runs.map(run => `<button type="button" data-model="${esc(run.model)}" aria-pressed="false" aria-controls="ev-media">
      <span class="ev-play" aria-hidden="true">▶</span>
      <span class="ev-model-info"><strong>${esc(modelName(run.model))}</strong>
        <span><span class="ev-sr">생성 시간 </span>${elapsed(run.seconds)}<i aria-hidden="true"> · </i><span class="ev-sr">비용 </span>${cost(run.usd)}</span>
      </span></button>`).join("");
    showRun(model);
    renderArchive();
  }

  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-model]");
    if (button && button.dataset.model !== currentModel) showRun(button.dataset.model);
  });
  roundSelect.addEventListener("change", () => selectEvidence(roundSelect.value, task.id, currentModel));
  taskSelect.addEventListener("change", () => selectEvidence(currentRound, taskSelect.value, currentModel));

  selectEvidence("plain", "racing");
  return selectEvidence;
}
