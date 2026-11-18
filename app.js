import { initEvidence, taskNames } from './evidence.js';
import { renderRecords } from './records.js';

const el = id => document.getElementById(id);
const roundNames = {plain:'기본 설정', fair:'이미지 생성 끔', ep7:'재대결'};
const labels = {
  plain: 'Codex 기본 설정으로 실험했어요. Astra의 레이싱과 두 GPT 모델의 캠핑카 사이트에는 내장 이미지 생성 도구가 쓰였어요.',
  fair: 'GPT의 이미지 생성, 앱, 메모리, 웹 검색을 끄고 사용자 설정도 제외했어요. Claude는 첫 라운드 결과를 그대로 심사했어요.',
  ep7: '이전 강의의 과제로 다시 겨뤘어요. GPT-6.2는 이미지 도구를 끈 설정을 썼고, Claude와 GPT-6.1 Sol은 이전 결과를 사용했어요.'
};
const shortName = model => model.name.replace(' (fair)', '');
const currency = value => '$' + value.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:3});
function icon(paths) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
}
const symbols = [
  '<path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
  '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M9 5V3h6v2M8 11h8m-8 5h5"/>',
  '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  '<path d="m6 10-3 4v6h18v-6l-3-4M3 14h18m-14-7 4-5 6 5-4 5z"/>'
];

function showStats(data) {
  const rounds = Object.values(data.sets);
  const tasks = rounds.flatMap(round => round.tasks);
  const counts = [rounds.length, new Set(tasks.map(t => t.id)).size, new Set(tasks.flatMap(t => t.runs.map(r => r.video))).size, new Set(tasks.flatMap(t => Object.keys(t.votes))).size];
  el('stats').innerHTML = ['실험 라운드','코딩 과제','실행 영상','심사 모델'].map((label,i) =>
    '<div class="stat">'+icon(symbols[i])+'<div><dt>'+label+'</dt><dd>'+counts[i]+'<small>'+['회','개','개','개'][i]+'</small></dd></div></div>'
  ).join('');
}

function initScores(data) {
  const rounds = Object.keys(data.sets);
  const switcher = el('round-switch');
  switcher.replaceChildren(...rounds.map((key, index) => {
    const button=document.createElement('button');
    button.type='button'; button.dataset.round=key;
    button.textContent=key === 'ep7' ? roundNames[key] : (index+1)+'차 · '+roundNames[key];
    button.addEventListener('click',()=>render(key));
    return button;
  }));
  function render(key) {
    switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.round === key)));
    const round = data.sets[key];
    const {total,noself,first_votes} = round.tally;
    const entries = Object.entries(total).sort((a,b)=>b[1]-a[1]);
    const rows = entries.map(([id, score],i)=>{
      const runs=round.tasks.flatMap(task=>task.runs.filter(r=>r.model===id));
      const seconds=runs.reduce((sum,r)=>sum+r.seconds,0);
      const cost=runs.reduce((sum,r)=>sum+r.usd,0);
      return '<tr><td class="rank">'+(i+1)+'</td><th scope="row">'+shortName(data.models[id])+'</th><td class="points"><b>'+score+'</b><span><i style="width:'+score/entries[0][1]*100+'%"></i></span></td><td>'+noself[id]+'</td><td>'+(first_votes[id]??0)+'</td><td>'+currency(cost)+'</td><td>'+Math.floor(seconds/60)+'분 '+seconds%60+'초</td></tr>';
    }).join('');
    el('scores').innerHTML='<div class="table-wrap" role="region" tabindex="0" aria-label="라운드 모델별 결과, 작은 화면에서는 가로로 스크롤하세요"><table aria-label="'+roundNames[key]+' 점수와 실행 기록"><thead><tr><th scope="col">순위</th><th scope="col">모델</th><th scope="col">총점</th><th scope="col">자기표 제외</th><th scope="col">1위 표</th><th scope="col">비용 합계</th><th scope="col">시간 합계</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    const [winner,points]=entries[0];
    el('round-note').innerHTML='<span class="note-top">'+icon('<path d="M8 3h8v5a4 4 0 0 1-8 0zM8 5H4v2a4 4 0 0 0 5 4m7-6h4v2a4 4 0 0 1-5 4m-3 1v5m-5 3h10m-8-3h6"/>')+' 라운드 우승</span><h3>'+shortName(data.models[winner])+'</h3><p class="winner-tally">총점 <b>'+points+'점</b> · 자기표 제외 <b>'+noself[winner]+'점</b></p><p>'+labels[key]+'</p>';
  }
  render('plain');
}

function initFeature(data,selectEvidence) {
  const tasks=data.sets.plain.tasks;
  let index=0;
  const viewer=el('viewer'), video=viewer.querySelector('video');
  function selected() {return tasks[index].runs[0];}
  function paint() {
    const task=tasks[index], run=selected(), name=shortName(data.models[run.model]);
    el('feature-img').src=run.video.replace('rec/','assets/posters/').replace(/\.mp4$/,'.jpg');
    el('feature-img').alt=name+'의 '+taskNames[task.id]+' 실행 장면';
    el('feature-title').textContent=taskNames[task.id];
    el('feature-model').textContent=name;
    el('feature-play').setAttribute('aria-label',name+'의 '+taskNames[task.id]+' 영상 재생');
    el('scene-count').textContent=(index+1)+' / '+tasks.length;
  }
  el('next').onclick=()=>{index=(index+1)%tasks.length;paint();};
  el('prev').onclick=()=>{index=(index+tasks.length-1)%tasks.length;paint();};
  el('feature-play').onclick=()=>{
    el('video-title').textContent=taskNames[tasks[index].id]+' · '+shortName(data.models[selected().model]);
    video.poster=el('feature-img').src; video.src=selected().video;
    viewer.showModal(); video.play().catch(()=>{});
  };
  viewer.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();});
  el('close-viewer').onclick=()=>viewer.close();
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  el('view-evidence').onclick=()=>{viewer.close();selectEvidence('plain',tasks[index].id,selected().model);};
  paint();
}

async function main() {
  const response=await fetch('./data.json');
  if(!response.ok)throw new Error('data');
  const data=await response.json();
  el('report-date').dateTime=data.date;
  el('report-date').textContent=data.date.replaceAll('-','. ');
  showStats(data);
  initScores(data);
  el('records-sections').innerHTML=renderRecords(data);
  initFeature(data,initEvidence(data));
  el('status').hidden=true; el('report').hidden=false;
  const anchor=document.getElementById(location.hash.slice(1));
  if(anchor)requestAnimationFrame(()=>anchor.scrollIntoView());
}
main().catch(()=>{el('status').innerHTML='실험 기록을 불러오지 못했어요. <a href="">다시 불러오기</a> · <a href="data.json">원본 데이터 열기</a>';});
