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
const REPO = "https://github.com/techkwon/gpt62-oneshot-bench";
const repoBlob = path => `${REPO}/blob/main/${path}`;
const BLOB_LIMIT = 1000000; // GitHub's code view does not render files above ~1 MB
const codeLink = (run, label) => run.bytes > BLOB_LIMIT
  ? `<span class="ev-big" title="파일이 커서 GitHub 코드 보기로는 열리지 않아요. 원본을 내려받아 보세요.">코드 ${(run.bytes / 1e6).toFixed(1)}MB</span>`
  : `<a href="${esc(repoBlob(run.file))}" target="_blank" rel="noopener noreferrer">${label}</a>`;

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
    <div class="ev-grid-head"><h3>모든 결과물 한눈에 보기</h3><p>모델이 만든 원본 파일을 그대로 올려 두었어요. 카드의 버튼으로 직접 열어 실행해 보세요.</p></div>
    <div class="ev-grid" id="ev-grid"></div>
    <div class="ev-disclosures" id="ev-disclosures"></div>
    <p class="ev-sr" role="status" id="ev-status"></p>
  </div>`;

  const roundSelect = root.querySelector("#ev-round");
  const taskSelect = root.querySelector("#ev-task");
  const list = root.querySelector("#ev-model-list");
  const viewer = root.querySelector("#ev-media");
  const archive = root.querySelector("#ev-disclosures");
  const grid = root.querySelector("#ev-grid");
  const status = root.querySelector("#ev-status");
  let task;
  let currentRound;
  let currentModel;
  let mode = "video";
  const fitLive = () => viewer.querySelectorAll("[data-live]").forEach(box => {
    const frame = box.querySelector("iframe");
    frame.style.transform = `scale(${box.clientWidth / 1280})`;
  });
  new ResizeObserver(fitLive).observe(viewer);
  viewer.addEventListener("click", event => {
    const button = event.target.closest("button[data-mode]");
    if (button && button.dataset.mode !== mode) {
      mode = button.dataset.mode; showRun(currentModel);
      viewer.querySelector(`button[data-mode="${mode}"]`)?.focus();
    }
  });

  function showRun(modelId) {
    const run = task.runs.find(item => item.model === modelId) ||
      task.runs.find(item => baseModel(item.model) === baseModel(modelId || "")) || task.runs[0];
    currentModel = run.model;
    const title = `${taskNames[task.id]} · ${modelName(run.model)}`;
    const poster = `assets/posters/${run.video.split("/").at(-1).replace(/\.mp4$/, ".jpg")}`;
    viewer.querySelector("video")?.pause();
    const isSvg = run.file.endsWith(".svg");
    const stage = mode === "live"
      ? (isSvg
        ? `<div class="ev-live ev-live-svg"><img src="${esc(run.file)}" alt="${esc(title)} 원본 SVG"></div>`
        : `<div class="ev-live" data-live><iframe title="${esc(title)} 원본 실행" src="${esc(run.file)}" allow="fullscreen; autoplay" loading="lazy"></iframe></div>`)
      : `<video aria-label="${esc(title)} 실행 녹화" controls muted playsinline preload="none" poster="${esc(poster)}" src="${esc(run.video)}"></video>`;
    viewer.innerHTML = `<div class="ev-mode" role="group" aria-label="보기 방식">
        <button type="button" data-mode="video" aria-pressed="${mode === "video"}">녹화 영상</button>
        <button type="button" data-mode="live" aria-pressed="${mode === "live"}">원본 실행</button>
        ${mode === "live" ? `<span class="ev-mode-hint">화면을 클릭한 뒤 키보드·마우스로 조작해 보세요</span>` : ""}
      </div>${stage}
      <div class="ev-caption">
        <div><h3>${esc(taskNames[task.id])}</h3><span>${esc(modelName(run.model))}</span></div>
        <div class="ev-links">
          <a href="${esc(run.file)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(title)} 결과물 열기 (새 창)">결과물 열기 <span aria-hidden="true">↗</span></a>
          <a href="${esc(run.file)}" download="${esc(`${currentRound}-${task.id}-${run.model}.${run.file.split(".").at(-1)}`)}" aria-label="${esc(title)} 원본 파일 내려받기">원본 파일 <span aria-hidden="true">↓</span></a>
          ${codeLink(run, "코드 보기 ↗")}
          <a href="${esc(run.video)}" download aria-label="${esc(title)} 녹화 영상 내려받기">영상 <span aria-hidden="true">↓</span></a>
        </div>
      </div>`;
    fitLive();
    list.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.model === currentModel));
    });
    status.textContent = `${roundNames[currentRound]}, ${title} ${mode === "live" ? "원본 실행" : "녹화 영상"}을 선택했어요.`;
  }

  function taskPoints() {
    const points = {};
    for (const vote of Object.values(task.votes)) {
      const n = vote.ranking.length;
      vote.ranking.forEach((id, index) => { points[id] = (points[id] || 0) + n - 1 - index; });
    }
    return points;
  }

  function renderGrid() {
    const points = taskPoints();
    const best = Math.max(...Object.values(points), 0);
    grid.innerHTML = task.runs.map(run => {
      const name = modelName(run.model);
      const ext = run.file.split(".").at(-1);
      const pts = points[run.model];
      const poster = run.video ? `assets/posters/${run.video.split("/").at(-1).replace(/\.mp4$/, ".jpg")}` : "";
      return `<article class="ev-card${pts === best && best > 0 ? " is-top" : ""}">
        ${run.video ? `<video muted loop playsinline controls preload="none" poster="${esc(poster)}" src="${esc(run.video)}" aria-label="${esc(name)} 녹화 미리보기"></video>` : ""}
        <div class="ev-card-body">
          <div class="ev-card-name"><strong>${esc(name)}</strong>${pts !== undefined ? `<span class="ev-card-pts">심사 ${pts}점</span>` : ""}</div>
          <p class="ev-card-meta">생성 ${elapsed(run.seconds)} · ${cost(run.usd)}</p>
          <div class="ev-card-actions">
            <a class="ev-open" href="${esc(run.file)}" target="_blank" rel="noopener noreferrer">직접 열어 보기 <span aria-hidden="true">→</span><span class="ev-sr"> (새 창)</span></a>
            <a href="${esc(run.file)}" download="${esc(`${currentRound}-${task.id}-${run.model}.${ext}`)}">원본 ↓</a>
            ${codeLink(run, "코드 ↗")}
          </div>
        </div>
      </article>`;
    }).join("");
    grid.querySelectorAll("video").forEach(video => {
      video.addEventListener("mouseenter", () => { if (!matchMedia("(prefers-reduced-motion: reduce)").matches) video.play().catch(() => {}); });
      video.addEventListener("mouseleave", () => video.pause());
    });
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
          <p class="ev-raw">투표 원문: ${Object.keys(task.votes).map(judge => `<a href="${esc(`${task.votes_dir}/vote-${judge}.json`)}" download>${esc(modelName(judge))} JSON ↓</a> <a href="${esc(`${task.votes_dir}/raw-${judge}.txt`)}" download>답변 그대로 ↓</a>`).join(" · ")}</p>
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
    renderGrid();
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
