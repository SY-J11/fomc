const rows = [
 ['기준금리', [['미국 기준금리','FRED:FEDFUNDS']]],
 ['국채금리', [['2년물 국채금리','FRED:DGS2'],['10년물 국채금리','FRED:DGS10'],['30년물 국채금리','FRED:DGS30']]],
 ['기대 인플레이션', [['5년 기대 인플레이션','FRED:T5YIE'],['10년 기대 인플레이션','FRED:T10YIE']]],
 ['PCE', [['PCE','FRED:PCEPI'],['근원 PCE','FRED:PCEPILFE']]],
 ['CPI', [['CPI','FRED:CPIAUCSL'],['근원 CPI','FRED:CPILFESL']]],
 ['PPI', [['PPI','FRED:PPIACO'],['근원 PPI','ECONOMICS:USCPPI']]],
 ['고용', [['실업률','FRED:UNRATE'],['비농업 고용자 수','FRED:PAYEMS']]],
 ['임금·실업수당', [['시간당 평균 임금','FRED:CES0500000003'],['신규 실업수당 청구건수','FRED:ICSA'],['계속 실업수당 청구건수','FRED:CCSA']]],
 ['구인·참가율', [['JOLTS 구인건수','FRED:JTSJOL'],['경제활동 참가율','FRED:CIVPART']]],
 ['GDP', [['GDP','FRED:GDP'],['GDP 성장률','FRED:A191RL1Q225SBEA']]],
 ['산업', [['산업생산지수','FRED:INDPRO'],['산업 가동률','FRED:TCU']]],
 ['소비·심리', [['소매판매','FRED:RSAFS'],['개인소득','FRED:PI'],['미시간대 소비자심리지수','FRED:UMCSENT']]],
 ['달러·금리선물', [['달러 인덱스','TVC:DXY'],['기준금리 선물','CBOT:ZQ1!']]],
 ['미시간대 기대 인플레이션', [['미시간대 1년 기대인플레이션','ECONOMICS:USMIE1Y'],['미시간대 5년 기대인플레이션','ECONOMICS:USMIE5Y'],['미시간대 10년 기대인플레이션 대체지표','FRED:T10YIE']]]
];
const summary = document.getElementById('summaryRows');
const charts = document.getElementById('charts');
const all = [];
rows.forEach((row, i) => {
  const line = document.createElement('div'); line.className = 'summary-row';
  const no = document.createElement('div'); no.className = 'row-no'; no.textContent = String(i+1).padStart(2,'0');
  const metrics = document.createElement('div'); metrics.className = 'metrics';
  row[1].forEach(([label,symbol]) => {
    all.push({label,symbol,group:row[0]});
    const item = document.createElement('div'); item.className='metric';
    const a=document.createElement('a'); a.href=`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`; a.target='_blank'; a.rel='noopener';
    const name=document.createElement('span'); name.className='metric-name'; name.textContent=label;
    const code=document.createElement('span'); code.className='metric-symbol'; code.textContent=symbol.replace('ECONOMICS:','');
    a.append(name,code); item.append(a); metrics.append(item);
  });
  // TradingView ticker tape: row-specific live/latest quote values
  const tape=document.createElement('div'); tape.className='summary-tape';
  const script=document.createElement('script'); script.type='text/javascript'; script.src='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'; script.async=true;
  const symbols=row[1].map(([title,proName])=>({proName,title}));
  script.text=JSON.stringify({symbols,showSymbolLogo:false,colorTheme:'light',isTransparent:true,displayMode:'regular',locale:'kr'});
  tape.append(script);
  line.append(no,metrics,tape); summary.append(line);
});
all.forEach((item,i)=>{
  const card=document.createElement('article'); card.className='chart-card';
  const head=document.createElement('div'); head.className='chart-head';
  const title=document.createElement('b'); title.textContent=item.label;
  const link=document.createElement('a'); link.href=`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(item.symbol)}`; link.target='_blank'; link.rel='noopener'; link.textContent=item.symbol+' ↗';
  head.append(title,link);
  const frame=document.createElement('iframe'); frame.className='chart-frame'; frame.loading='eager'; frame.title=item.label+' TradingView 차트'; frame.referrerPolicy='no-referrer-when-downgrade';
  frame.src=`https://www.tradingview.com/widgetembed/?frameElementId=tv_${i}&symbol=${encodeURIComponent(item.symbol)}&interval=1M&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f5f7fa&studies=[]&theme=light&style=1&timezone=Asia%2FSeoul&withdateranges=1&hideideas=1&locale=kr`;
  frame.addEventListener('error',()=>{frame.replaceWith(Object.assign(document.createElement('a'),{href:`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(item.symbol)}`,target:'_blank',textContent:'TradingView에서 차트 열기',className:'chart-fallback'}));});
  const note=document.createElement('div'); note.className='chart-note'; note.textContent=item.group+' · TradingView / 원자료 제공기관';
  card.append(head,frame,note); charts.append(card);
});
document.getElementById('refresh').addEventListener('click',()=>{
 document.querySelectorAll('.chart-frame').forEach(f=>{const u=new URL(f.src);u.searchParams.set('refresh',Date.now());f.src=u.toString();});
 document.getElementById('updated').textContent='차트 새로고침 요청';
});
document.getElementById('status').textContent=`14개 행 · ${all.length}개 지표`;
document.querySelector('.summary .section-heading small').textContent='요청한 순서 · 총 14줄 · 최신 수치';
