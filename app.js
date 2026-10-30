'use strict';

// FRED 시계열과 Yahoo Finance 일봉 데이터를 직접 받아 요약·차트를 그립니다.
const PROXY_BASE = 'https://fomc.mcraft-tiger-574.workers.dev';
const $ = id => document.getElementById(id);
const blank = '—';

const rows = [
  ['기준금리', [
    {id:'fedfunds',name:'기준금리',source:'fred',ticker:'FEDFUNDS',unit:'%',decimals:2}
  ]],
  ['국채금리', [
    {id:'us2y',name:'2년물 국채금리',source:'fred',ticker:'DGS2',unit:'%',decimals:2},
    {id:'us10y',name:'10년물 국채금리',source:'fred',ticker:'DGS10',unit:'%',decimals:2},
    {id:'us30y',name:'30년물 국채금리',source:'fred',ticker:'DGS30',unit:'%',decimals:2}
  ]],
  ['기대 인플레이션', [
    {id:'t5yie',name:'5년 기대 인플레이션',source:'fred',ticker:'T5YIE',unit:'%',decimals:2},
    {id:'t10yie',name:'10년 기대 인플레이션',source:'fred',ticker:'T10YIE',unit:'%',decimals:2}
  ]],
  ['PCE', [
    {id:'pce',name:'PCE',source:'fred',ticker:'PCEPI',unit:'지수',decimals:2},
    {id:'corepce',name:'근원 PCE',source:'fred',ticker:'PCEPILFE',unit:'지수',decimals:2}
  ]],
  ['CPI', [
    {id:'cpi',name:'CPI',source:'fred',ticker:'CPIAUCSL',unit:'지수',decimals:2},
    {id:'corecpi',name:'근원 CPI',source:'fred',ticker:'CPILFESL',unit:'지수',decimals:2}
  ]],
  ['PPI', [
    {id:'ppi',name:'PPI',source:'fred',ticker:'PPIACO',unit:'지수',decimals:2},
    {id:'coreppi',name:'근원 PPI',source:'fred',ticker:'WPSFD4131',unit:'지수',decimals:2}
  ]],
  ['고용', [
    {id:'unrate',name:'실업률',source:'fred',ticker:'UNRATE',unit:'%',decimals:2},
    {id:'payems',name:'비농업 고용자 수',source:'fred',ticker:'PAYEMS',unit:'천 명',decimals:0,scale:0.001,displayUnit:'백만 명'}
  ]],
  ['임금·실업수당', [
    {id:'wage',name:'시간당 평균 임금',source:'fred',ticker:'CES0500000003',unit:'달러',decimals:2},
    {id:'icsa',name:'신규 실업수당 청구건수',source:'fred',ticker:'ICSA',unit:'건',decimals:0,scale:1000,displayUnit:'천 건'},
    {id:'ccsa',name:'계속 실업수당 청구건수',source:'fred',ticker:'CCSA',unit:'건',decimals:0,scale:1000,displayUnit:'천 건'}
  ]],
  ['구인·참가율', [
    {id:'jolts',name:'JOLTS 구인건수',source:'fred',ticker:'JTSJOL',unit:'천 건',decimals:0},
    {id:'civpart',name:'경제활동 참가율',source:'fred',ticker:'CIVPART',unit:'%',decimals:2}
  ]],
  ['GDP', [
    {id:'gdp',name:'GDP',source:'fred',ticker:'GDP',unit:'십억 달러',decimals:0,scale:0.001,displayUnit:'조 달러'},
    {id:'gdpgrowth',name:'GDP 성장률',source:'fred',ticker:'A191RL1Q225SBEA',unit:'%',decimals:2}
  ]],
  ['산업', [
    {id:'indpro',name:'산업생산지수',source:'fred',ticker:'INDPRO',unit:'지수',decimals:2},
    {id:'tcu',name:'산업 가동률',source:'fred',ticker:'TCU',unit:'%',decimals:2}
  ]],
  ['소비·심리', [
    {id:'rsafs',name:'소매판매',source:'fred',ticker:'RSAFS',unit:'백만 달러',decimals:0,scale:0.001,displayUnit:'십억 달러'},
    {id:'income',name:'개인소득',source:'fred',ticker:'PI',unit:'십억 달러',decimals:0,scale:0.001,displayUnit:'조 달러'},
    {id:'umcsent',name:'미시간대 소비자심리지수',source:'fred',ticker:'UMCSENT',unit:'지수',decimals:1}
  ]],
  ['달러·금리선물', [
    {id:'dxy',name:'달러 인덱스',source:'yahoo',ticker:'DX-Y.NYB',unit:'지수',decimals:2},
    {id:'fedfuture',name:'기준금리 선물 내재금리',source:'yahoo',ticker:'ZQ=F',unit:'%',decimals:2,transform:v=>100-v}
  ]],
  ['미시간대 기대 인플레이션', [
    {id:'mich1y',name:'미시간대 1년 기대인플레이션',source:'fred',ticker:'MICH',unit:'%',decimals:2},
    {id:'mich5y',name:'5년 기대인플레이션 (Cleveland Fed 대체지표)',source:'fred',ticker:'EXPINF5YR',unit:'%',decimals:2},
    {id:'mich10y',name:'10년 기대인플레이션 (10년 BEI 대체지표)',source:'fred',ticker:'T10YIE',unit:'%',decimals:2}
  ]]
];
const all = rows.flatMap((row, rowIndex) => row[1].map(item => ({...item,group:row[0],rowIndex})));
const charts = new Map();
const chartCards = new Map();

function fmt(value, decimals=2) {
  if (!Number.isFinite(value)) return blank;
  return value.toLocaleString('ko-KR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}
function shownValue(item,value) {
  const n = item.scale ? value * item.scale : value;
  const unit = item.displayUnit || item.unit;
  return `${fmt(n,item.decimals)}${unit==='%'?'%':unit==='지수'?'':` ${unit}`}`;
}
function signed(value,decimals=2) {
  if (!Number.isFinite(value)) return blank;
  return `${value>0?'+':''}${fmt(value,decimals)}`;
}
function dateLabel(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('ko-KR',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'});
}
function proxyUrl(target) { return `${PROXY_BASE}/?url=${encodeURIComponent(target)}`; }

function makeSummary() {
  const root=$('summaryRows'); root.innerHTML='';
  rows.forEach(([group,items],index)=>{
    const line=document.createElement('div'); line.className='summary-row';
    const metrics=document.createElement('div'); metrics.className=`metrics ${items.length===1?'single':items.length===2?'double':'triple'}`;
    items.forEach(item=>{
      const chip=document.createElement('article'); chip.className='metric'; chip.dataset.summaryId=item.id;
      const top=document.createElement('div'); top.className='metric-top';
      const name=document.createElement('span'); name.className='metric-name'; name.textContent=item.name;
      const source=document.createElement('span'); source.className='metric-source'; source.textContent=item.source==='fred'?'FRED':item.ticker;
      top.append(name,source);
      const value=document.createElement('strong'); value.className='metric-value'; value.textContent='불러오는 중…';
      const change=document.createElement('span'); change.className='metric-change neutral'; change.textContent='—';
      chip.append(top,value,change); metrics.append(chip);
    });
    line.append(metrics); root.append(line);
  });
}

function makeCharts() {
  const root=$('charts'); root.innerHTML='';
  rows.forEach(([group,items],index)=>{
    const section=document.createElement('section'); section.className='chart-group';
    const heading=document.createElement('div'); heading.className='section-heading group-heading';
    heading.innerHTML=`<div><span class="eyebrow">INDICATOR GROUP ${String(index+1).padStart(2,'0')}</span><h2>${group}</h2></div>`;
    const grid=document.createElement('div'); grid.className='chart-grid';
    items.forEach(item=>{
      const card=document.createElement('article'); card.className='chart-card';
      const head=document.createElement('div'); head.className='chart-head';
      const title=document.createElement('b'); title.textContent=item.name;
      const link=document.createElement('a');
      link.href=item.source==='fred'?`https://fred.stlouisfed.org/series/${item.ticker}`:`https://finance.yahoo.com/quote/${encodeURIComponent(item.ticker)}/`;
      link.target='_blank'; link.rel='noopener noreferrer'; link.textContent='원자료 ↗';
      head.append(title,link);
      const quote=document.createElement('div'); quote.className='chart-quote';
      quote.innerHTML='<strong class="chart-latest">—</strong><span class="chart-change neutral">데이터 조회 중</span><small class="chart-date"></small>';
      const area=document.createElement('div'); area.className='chart-area'; area.id=`chart-${item.id}`;
      const foot=document.createElement('div'); foot.className='chart-foot'; foot.textContent=`${item.ticker} · ${item.source==='fred'?'FRED':'Yahoo Finance'}`;
      card.append(head,quote,area,foot); grid.append(card); chartCards.set(item.id,card);
    });
    section.append(heading,grid); root.append(section);
  });
}

async function fetchFred(item) {
  // FRED 전용 Worker 경로를 사용합니다. 전체 URL 허용목록 검사로 인한 403을 피합니다.
  const endpoint=`${PROXY_BASE}/fred.csv?series=${encodeURIComponent(item.ticker)}&start=2015-01-01`;
  const response=await fetch(endpoint,{cache:'no-store',headers:{'Accept':'text/csv,text/plain,*/*'}});
  if(!response.ok){
    let detail='';
    try{detail=(await response.text()).slice(0,220);}catch{}
    throw new Error(`FRED 데이터 연결 HTTP ${response.status}${detail?`: ${detail}`:''}`);
  }
  const csv=(await response.text()).replace(/^\uFEFF/,'').trim();
  if(!/^observation_date,/i.test(csv)) {
    let detail=csv.slice(0,260).replace(/\s+/g,' ');
    try { const payload=JSON.parse(csv); detail=payload.error || payload.message || payload.detail || JSON.stringify(payload).slice(0,220); } catch {}
    throw new Error(`FRED CSV 형식이 아닙니다: ${detail || '빈 응답'} · Worker의 /fred.csv 경로 및 배포 버전을 확인하세요`);
  }
  const values=csv.split(/\r?\n/).slice(1).map(line=>{
    const parts=line.split(','); const date=(parts[0]||'').trim(); const raw=(parts[1]||'').trim();
    const value=raw==='.'||raw===''?NaN:Number(raw);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(value)) return null;
    return {time:Math.floor(Date.parse(`${date}T00:00:00Z`)/1000),value:item.transform?item.transform(value):value,date};
  }).filter(Boolean);
  if(values.length<2) throw new Error('FRED 관측값 부족');
  return values;
}

async function fetchYahoo(item) {
  const target=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.ticker)}?range=5y&interval=1d&events=div%2Csplits`;
  const response=await fetch(proxyUrl(target),{cache:'no-store',headers:{'Accept':'application/json,*/*'}});
  if(!response.ok){let detail='';try{detail=(await response.text()).slice(0,180);}catch{}throw new Error(`데이터 프록시 HTTP ${response.status}${detail?`: ${detail}`:''}`);}
  const json=await response.json(); const result=json?.chart?.result?.[0];
  if(!result) throw new Error(json?.chart?.error?.description||'Yahoo 시계열 없음');
  const timestamps=result.timestamp||[]; const closes=result.indicators?.quote?.[0]?.close||[];
  const values=[];
  timestamps.forEach((time,i)=>{
    const raw=closes[i]; if(raw===null||raw===undefined||!Number.isFinite(Number(raw))) return;
    const value=item.transform?item.transform(Number(raw)):Number(raw);
    values.push({time,value,date:new Date(time*1000).toISOString().slice(0,10)});
  });
  if(values.length<2) throw new Error('Yahoo 관측값 부족');
  return values;
}

function renderItem(item,values) {
  const last=values[values.length-1],prev=values[values.length-2];
  const delta=last.value-prev.value; const pct=prev.value!==0?delta/Math.abs(prev.value)*100:null;
  const card=chartCards.get(item.id);
  const summary=document.querySelector(`[data-summary-id="${item.id}"]`);
  if(summary){
    summary.querySelector('.metric-value').textContent=shownValue(item,last.value);
    const change=summary.querySelector('.metric-change');
    const unit=item.unit==='%'?'%p':item.displayUnit?` ${item.displayUnit}`:item.unit==='지수'?'':` ${item.unit}`;
    change.textContent=`${signed(delta,item.decimals)}${unit} · ${pct===null?blank:`${pct>0?'+':''}${fmt(pct,2)}%`} · ${dateLabel(last.date)}`;
    change.className=`metric-change ${delta>0?'up':delta<0?'down':'neutral'}`;
  }
  if(!card) throw new Error(`차트 카드 요소를 찾을 수 없습니다: ${item.id}`);
  const latestEl=card.querySelector('.chart-latest');
  const changeEl=card.querySelector('.chart-change');
  const dateEl=card.querySelector('.chart-date');
  const footEl=card.querySelector('.chart-foot');
  if(!latestEl || !changeEl || !dateEl || !footEl) throw new Error(`차트 내부 요소가 누락되었습니다: ${item.id}`);
  latestEl.textContent=shownValue(item,last.value);
  changeEl.textContent=`${signed(delta,item.decimals)}${item.unit==='%'?'%p':item.unit==='지수'?'':` ${item.unit}`} · ${pct===null?blank:`${pct>0?'+':''}${fmt(pct,2)}%`}`;
  changeEl.className=`chart-change ${delta>0?'up':delta<0?'down':'neutral'}`;
  dateEl.textContent=`최근 관측일 ${dateLabel(last.date)} · 직전 관측 대비`;
  const area=$(`chart-${item.id}`);
  if(!area) throw new Error(`차트 영역을 찾을 수 없습니다: ${item.id}`);
  area.innerHTML='';
  if(!window.LightweightCharts){area.textContent='차트 라이브러리를 불러오지 못했습니다.';return;}
  const chart=LightweightCharts.createChart(area,{
    width:area.clientWidth||320,height:220,
    layout:{background:{type:'solid',color:'#ffffff'},textColor:'#8995a6',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',fontSize:10},
    grid:{vertLines:{color:'#f0f3f7'},horzLines:{color:'#f0f3f7'}},
    rightPriceScale:{borderColor:'#e6eaf1',scaleMargins:{top:.12,bottom:.12}},
    timeScale:{borderColor:'#e6eaf1',timeVisible:false,rightOffset:2,barSpacing:7,minBarSpacing:.5},
    localization:{locale:'ko-KR',priceFormatter:v=>fmt(v,item.decimals)}
  });
  const series=chart.addLineSeries({color:delta>=0?'#d84a4a':'#3478d4',lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerVisible:true});
  series.setData(values.map(v=>({time:v.time,value:v.value})));
  chart.timeScale().fitContent(); charts.set(item.id,{chart,area});
  footEl.textContent=`${item.ticker} · ${values.length.toLocaleString('ko-KR')}개 관측값 · ${dateLabel(values[0].date)} ~ ${dateLabel(last.date)}`;
}

async function refreshAll() {
  const button=$('refresh'); button.disabled=true;
  $('status').textContent='지표 데이터 불러오는 중…'; $('updated').textContent='업데이트 중';
  let success=0,fail=0,cursor=0;
  const queue=[...all];
  async function worker(){
    while(cursor<queue.length){
      const item=queue[cursor++];
      try{const values=item.source==='fred'?await fetchFred(item):await fetchYahoo(item);renderItem(item,values);success++;}
      catch(error){
        fail++;
        const message=String(error?.message||error);
        const summary=document.querySelector(`[data-summary-id="${item.id}"]`);
        if(summary){
          const valueEl=summary.querySelector('.metric-value');
          const changeEl=summary.querySelector('.metric-change');
          if(valueEl) valueEl.textContent='자료 없음';
          if(changeEl){changeEl.textContent=message;changeEl.className='metric-change neutral';}
        }
        const area=$(`chart-${item.id}`);
        if(area) area.innerHTML=`<div class="chart-error">${item.name} 그래프를 불러오지 못했습니다.<small>${message.slice(0,160)}</small></div>`;
      }
    }
  }
  await Promise.all([worker(),worker(),worker(),worker(),worker(),worker()]);
  $('updated').textContent=`${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 갱신`;
  $('status').textContent=fail?`정상 ${success}개 · 확인 필요 ${fail}개`:`${success}개 지표 연결 완료`;
  $('status').classList.toggle('error-note',fail>0); button.disabled=false; resizeCharts();
}
function resizeCharts(){for(const {chart,area} of charts.values()){if(area.clientWidth>0)chart.applyOptions({width:area.clientWidth,height:220});}}

makeSummary(); makeCharts(); $('refresh').addEventListener('click',refreshAll);
window.addEventListener('resize',()=>{clearTimeout(window.__fomcResize);window.__fomcResize=setTimeout(resizeCharts,120);});
refreshAll();
