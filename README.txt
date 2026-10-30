FOMC ECONOMIC DASHBOARD - FRED 전용 프록시 및 요약 레이아웃 수정본

중요: 이 버전은 FRED 전용 Worker 경로(/fred.csv)를 사용합니다.
따라서 웹앱 파일뿐 아니라 cloudflare_worker.js도 반드시 배포해야 합니다.
Worker를 교체하지 않으면 새 /fred.csv 요청이 처리되지 않아 데이터가 표시되지 않습니다.

배포 순서
1. ZIP 압축을 풉니다.
2. Cloudflare 대시보드 > Workers & Pages에서 FOMC 전용 Worker `fomc.mcraft-tiger-574`를 엽니다.
3. Edit code에서 이 ZIP의 cloudflare_worker.js 전체 코드로 기존 코드를 교체합니다.
4. Save and Deploy를 눌러 배포가 완료될 때까지 기다립니다.
5. FOMC 웹앱에 index.html, style.css, app.js를 새 파일로 배포합니다.
6. 웹앱을 완전히 새로고침한 뒤 새로고침 버튼을 누릅니다.

이번 수정
- FRED 데이터는 기존 `/?url=...` 전체 URL 프록시 경로 대신 `/fred.csv?series=...` 전용 경로로 요청합니다.
- Worker가 요청된 시리즈 ID를 허용 목록과 대조하고 FRED CSV URL을 직접 구성합니다. 브라우저에서 임의의 외부 URL을 넘기지 않으므로 이전의 URL not allowed 403 원인을 제거합니다.
- FRED 수신은 cors.dev, corsproxy.io, AllOrigins, FRED 원본 순서로 재시도합니다. cors.dev 요청에 Origin 헤더를 명시해 서버 간 요청에서 CSV 응답이 unsupported_response로 차단되는 문제를 보완했습니다. 응답이 CSV가 아니라 JSON/HTML이면 실제 응답의 오류 내용을 화면에 표시합니다.
- 모든 경로가 실패하면 520을 그대로 숨기지 않고 각 경로의 HTTP 상태와 실패 원인을 반환합니다.
- Yahoo Finance는 기존 Worker 프록시 경로를 유지합니다.
- 요약 화면 왼쪽 01~14 번호를 제거하고 요약 카드 영역을 좌우 전체 폭으로 확장했습니다.
- 지표가 1개인 줄은 1칸 전체 폭, 2개인 줄은 2칸, 3개인 줄은 3칸으로 배치합니다. 모바일에서는 2열, 아주 작은 화면에서는 1열로 표시합니다.
- 앱 파일의 캐시 버전을 올려 이전 JS/CSS가 남지 않도록 했습니다.

기존 Worker 공유 안내
이번 버전은 FOMC 전용 주소 `https://fomc.mcraft-tiger-574.workers.dev/`를 사용합니다. 반드시 이 주소에 연결된 `fomc.mcraft-tiger-574` Worker에 cloudflare_worker.js를 배포하세요. 기존 `pmc.mcraft-tiger-574` Worker에 배포하면 FOMC 웹앱은 새 주소를 사용하므로 반영되지 않습니다.

FRED 고지
This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.

검증 안내
JavaScript 문법 검사 및 ZIP 내부 파일 구성을 확인했습니다. 현재 실행 환경에서 Cloudflare 배포 및 외부 FRED 네트워크 응답을 직접 확인할 수 없으므로, 실제 데이터 수신은 배포 후 확인이 필요합니다.

추가 수정
- Cloudflare Worker 기본 주소를 https://fomc.mcraft-tiger-574.workers.dev 로 변경했습니다.
- 달러 인덱스와 기준금리 선물 차트 카드 참조 오류를 수정했습니다. 차트 카드가 원본 지표 객체와 별도 배열에 생성되던 문제로 인해 undefined.querySelector가 발생하던 부분을 ID 기반 맵으로 연결했습니다.
- 오류 처리 시 차트 영역이 존재하지 않아도 전체 조회가 중단되지 않도록 안전 검사를 추가했습니다.
- FRED 응답이 CSV가 아닐 때 JSON 오류 내용을 함께 표시하도록 개선했습니다.


2026-10-30 FRED 502 보완
- cors.dev 요청에 Origin 헤더를 추가했습니다. cors.dev는 Origin이 없는 서버 간 요청에서 CSV 외 콘텐츠 형식을 제한할 수 있으므로, Worker가 브라우저 요청과 같은 Origin을 명시해 CSV를 받도록 수정했습니다.
- 중계 응답의 X-Cors-Error / X-Cors-Source 정보도 실패 상세에 포함합니다.
- 실제 Cloudflare 배포 및 FRED 외부 연결 성공 여부는 배포 후 테스트해야 합니다.


2026-10-30 요약 카드 표시 수정
- 요약 카드의 등락 문자열 글자 크기를 기존 대비 약 1.2배로 확대했습니다.
- 글자 간격을 좁히고 가로 방향으로 살짝 압축해 표시 폭을 줄였습니다. 공간이 부족하면 내용이 잘리지 않도록 줄바꿈합니다.
- 지표가 3개인 요약 행은 모바일에서도 3열 한 줄을 유지합니다. 380px 이하 화면에서도 3열을 유지하도록 별도 규칙을 추가했습니다.
- 스타일 캐시 버전을 v5로 갱신했습니다.


[실업수당 청구건수 단위 수정]
ICSA(신규) 및 CCSA(계속) FRED 값은 1,000으로 나누어 건 단위로 표시합니다. 예: 194,000,000 -> 194,000건, 1,701,000,000 -> 1,701,000건. 요약 수치, 등락값 및 그래프 모두 동일하게 정규화합니다. app.js 캐시 버전은 v6입니다.


[국채금리 데이터 소스 변경]
2년물·10년물·30년물 국채금리는 장전 체크리스트와 동일하게 미국 재무부 공식 Daily Treasury Par Yield Curve XML에서 가져옵니다. Cloudflare Worker의 기존 treasury 허용 경로를 사용하며 FRED 시계열을 사용하지 않습니다.


2026-10-30 FRED 시리즈 허용 목록 보완
- DFEDTARU / DFEDTARL / T5YIFR / EXPINF1YR를 Worker의 FRED 허용 목록에 추가했습니다.
- 1년 기대 인플레이션은 존재하지 않는 T1YIE 대신 FRED의 1-Year Expected Inflation (EXPINF1YR, 월간) 시리즈를 사용합니다.
- 기존 5년/10년 기대 인플레이션 및 나머지 지표는 변경하지 않았습니다.

물가 지표 기준(2026-10-30 수정)
- PCE / 근원 PCE: BEA 분기별 전분기 대비 연율(SAAR), FRED DPCERV1Q225SBEA / DPCCRV1Q225SBEA
- CPI / 근원 CPI: 전년 동월 대비, 비계절조정 CPI 지수에서 12개월 변화율 계산(CPIAUCNS / CPILFENS)
- PPI / 근원 PPI: 계절조정 가격지수(PPIFIS / PPIFES)에서 전월 대비 변화율을 계산하고, BLS 발표 정밀도에 맞춰 소수점 첫째 자리로 반올림한 뒤 2자리 형식으로 표시합니다. 2026년 9월 기준 PPI 1.30%, 근원 PPI 0.70%.


2026-10-30 PCE 그래프 변환 오류 수정
- PCE(DPCERV1Q225SBEA) 및 근원 PCE(DPCCRV1Q225SBEA)는 FRED에서 이미 분기별 전분기 대비 연율(SAAR)로 제공되는 발표율 시계열입니다.
- 이전 코드가 이 분기별 발표율을 월별 원자료처럼 분기 평균 처리한 뒤 다시 연율화해 변환 후 관측값이 부족해지는 오류가 있었습니다.
- 두 PCE 시계열은 FRED 관측값을 그대로 그래프와 요약에 사용하도록 수정했습니다. 추가 평균이나 재연율화는 하지 않습니다.
- 앱 캐시 버전을 v11로 변경했습니다.


2026-10-30 PPI / 근원 PPI 지수-상승률 변환 수정
- PPIFIS / PPIFES는 상승률이 아닌 계절조정 가격지수이므로 전월 대비 변화율(monthOverMonth)을 계산하도록 수정했습니다.
- 변화율은 BLS 발표 정밀도에 맞춰 소수점 첫째 자리로 반올림하고 화면에는 소수점 둘째 자리까지 표시합니다.
- 2026년 9월 가격지수 기준 PPI 1.30%, 근원 PPI 0.70%가 표시됩니다.
- 기존 PCE 및 CPI 계산, 다른 지표와 레이아웃은 변경하지 않았습니다.
- 앱 캐시 버전을 v12로 변경했습니다.


[2026-10-30 임금·실업수당 요약 및 그래프 추가]
- 시간당 평균 임금 오른쪽에 Average Hourly Earnings (전년 대비) 상승률 지표를 추가했습니다. 동일한 CES0500000003 원자료에서 12개월 전 값과 비교해 전년 대비 상승률(%)을 계산합니다.
- 시간당 평균 임금과 전년 대비 상승률은 요약 화면에서 같은 줄에 나란히 표시됩니다.
- 신규 실업수당 청구건수(ICSA)와 계속 실업수당 청구건수(CCSA)를 각각 독립된 줄로 분리했습니다.
- 각 지표별 그래프도 자동으로 별도 생성됩니다. 임금 지표는 원자료 달러 금액, 전년 대비 상승률은 계산된 퍼센트 시계열로 표시됩니다.
- app.js 및 style.css 캐시 버전을 v13으로 갱신했습니다.
- Worker의 FRED 허용 목록에 CES0500000003이 이미 포함되어 있어 Worker 수정·재배포는 필요하지 않습니다.
