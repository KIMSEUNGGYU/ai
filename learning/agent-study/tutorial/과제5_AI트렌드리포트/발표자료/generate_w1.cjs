const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "AI 테크팀";
pres.title = "주간 AI 트렌드 보고서 - W1";

// Color palette: Midnight Executive
const C = {
  navy: "1E2761",
  ice: "CADCFC",
  white: "FFFFFF",
  accent: "F96167",
  gray: "8B95A5",
  darkText: "1E2761",
  lightText: "CADCFC",
  cardBg: "F4F6FA",
};

const makeShadow = () => ({
  type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.12,
});

// ========== SLIDE 1: 표지 ==========
const s1 = pres.addSlide();
s1.background = { color: C.navy };
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 3.8, w: 10, h: 0.06, fill: { color: C.accent },
});
s1.addText("주간 AI 트렌드 보고서", {
  x: 0.8, y: 1.2, w: 8.4, h: 1.2,
  fontSize: 40, fontFace: "Arial Black", color: C.white, bold: true,
});
s1.addText("W1 | 2026-03-02", {
  x: 0.8, y: 2.5, w: 8.4, h: 0.6,
  fontSize: 22, fontFace: "Arial", color: C.ice,
});
s1.addText("AI 테크팀", {
  x: 0.8, y: 4.2, w: 8.4, h: 0.5,
  fontSize: 16, fontFace: "Arial", color: C.gray,
});

// ========== SLIDE 2: 핵심 트렌드 3줄 ==========
const s2 = pres.addSlide();
s2.background = { color: C.white };
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s2.addText("핵심 트렌드 3줄 요약", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const trends = [
  { num: "01", title: '"크게 만들기"에서 "잘 쓰기"로', desc: "소형 모델(SLM)과 엣지 AI 부상. 비용 절감과 실시간 처리가 새로운 경쟁력" },
  { num: "02", title: "AI 에이전트가 실제 돈을 움직이기 시작", desc: "DBS Bank·Visa 자율 결제 파일럿 성공. 에이전트 커머스 시대 개막" },
  { num: "03", title: "1,000억$ 인프라 투자 + 규제 본격화", desc: "대규모 반도체·컴퓨팅 투자와 EU·영국 AI 규제가 동시 진행" },
];

trends.forEach((t, i) => {
  const y = 1.2 + i * 1.4;
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 8.4, h: 1.15, fill: { color: C.cardBg }, shadow: makeShadow(),
  });
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 0.07, h: 1.15, fill: { color: C.accent },
  });
  s2.addText(t.num, {
    x: 1.1, y, w: 0.6, h: 1.15,
    fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true, valign: "middle",
  });
  s2.addText(t.title, {
    x: 1.8, y: y + 0.1, w: 7, h: 0.5,
    fontSize: 16, fontFace: "Arial", color: C.darkText, bold: true, margin: 0,
  });
  s2.addText(t.desc, {
    x: 1.8, y: y + 0.55, w: 7, h: 0.45,
    fontSize: 12, fontFace: "Arial", color: C.gray, margin: 0,
  });
});

// ========== SLIDE 3: 주요 뉴스 TOP 3 ==========
const s3 = pres.addSlide();
s3.background = { color: C.white };
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s3.addText("주요 뉴스 TOP 3", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const news = [
  { title: "AI 에이전트, 금융 거래 자율 처리 성공", src: "Mean CEO Blog | 2026-03-01", point: "금융·커머스 AI 에이전트 통합이 필수가 될 전망" },
  { title: "AI 인프라 투자 1,000억$ 시대 개막", src: "Fladgate | 2026-02-04", point: "클라우드 비용 상승 대비 인프라 전략 재검토 필요" },
  { title: "소형 모델이 대세로 — AI 실용주의 전환", src: "TechCrunch | 2026-01-02", point: "SLM 전환 검토 시점. 비용·속도 동시 개선 가능" },
];

news.forEach((n, i) => {
  const y = 1.2 + i * 1.4;
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 8.4, h: 1.15, fill: { color: C.cardBg }, shadow: makeShadow(),
  });
  s3.addText(n.title, {
    x: 1.1, y: y + 0.08, w: 7.8, h: 0.4,
    fontSize: 15, fontFace: "Arial", color: C.darkText, bold: true, margin: 0,
  });
  s3.addText(n.src, {
    x: 1.1, y: y + 0.42, w: 7.8, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: C.gray, margin: 0,
  });
  s3.addText("→ " + n.point, {
    x: 1.1, y: y + 0.72, w: 7.8, h: 0.35,
    fontSize: 12, fontFace: "Arial", color: C.accent, bold: true, margin: 0,
  });
});

// ========== SLIDE 4: 기술 트렌드 ==========
const s4 = pres.addSlide();
s4.background = { color: C.white };
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s4.addText("기술 트렌드", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const techHeader = [
  [
    { text: "분야", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 12, fontFace: "Arial" } },
    { text: "동향", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 12, fontFace: "Arial" } },
    { text: "성숙도", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 12, fontFace: "Arial" } },
  ],
  [
    { text: "SLM / 엣지 AI", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "비용·지연시간 우위로 실용 배포 가속", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "성장기", options: { fontSize: 11, fontFace: "Arial", color: "2C5F2D", bold: true } },
  ],
  [
    { text: "AI 에이전트 / 초에이전트", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "복수 모델 조합. 금융 자율 업무 파일럿 성공", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "초기→성장", options: { fontSize: 11, fontFace: "Arial", color: "B85042", bold: true } },
  ],
  [
    { text: "저장소 인텔리전스", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "코드 맥락 이해하는 개발 AI", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "초기", options: { fontSize: 11, fontFace: "Arial", color: "065A82", bold: true } },
  ],
  [
    { text: "AI 의료진단 / 신약개발", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "진단 정확도 85.5%, 신약개발 비용 절감", options: { fontSize: 11, fontFace: "Arial" } },
    { text: "성장기", options: { fontSize: 11, fontFace: "Arial", color: "2C5F2D", bold: true } },
  ],
];

s4.addTable(techHeader, {
  x: 0.8, y: 1.2, w: 8.4,
  colW: [2.8, 4, 1.6],
  border: { pt: 0.5, color: "DEE2E6" },
  rowH: [0.45, 0.55, 0.55, 0.55, 0.55],
  autoPage: false,
});

// ========== SLIDE 5: 시장 트렌드 ==========
const s5 = pres.addSlide();
s5.background = { color: C.white };
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s5.addText("시장 트렌드", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const markets = [
  { stat: "$500B+", label: "AI 자본지출", desc: "빅테크 AI 인프라 투자 전례 없는 규모" },
  { stat: "$100B", label: "Micron 반도체 공장", desc: "뉴욕에 착공. AI 칩 공급 확대" },
  { stat: "$10B+", label: "OpenAI-Cerebras 계약", desc: "컴퓨팅 인프라 장기 확보" },
];

markets.forEach((m, i) => {
  const x = 0.8 + i * 2.9;
  s5.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.2, w: 2.6, h: 2.2, fill: { color: C.cardBg }, shadow: makeShadow(),
  });
  s5.addText(m.stat, {
    x, y: 1.3, w: 2.6, h: 0.8,
    fontSize: 32, fontFace: "Arial Black", color: C.accent, bold: true, align: "center", margin: 0,
  });
  s5.addText(m.label, {
    x, y: 2.1, w: 2.6, h: 0.4,
    fontSize: 13, fontFace: "Arial", color: C.darkText, bold: true, align: "center", margin: 0,
  });
  s5.addText(m.desc, {
    x: x + 0.15, y: 2.5, w: 2.3, h: 0.6,
    fontSize: 10, fontFace: "Arial", color: C.gray, align: "center", margin: 0,
  });
});

// 하단 키 메시지
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: 3.8, w: 8.4, h: 0.8, fill: { color: C.navy },
});
s5.addText("수익화 압력 증가 — OpenAI·Anthropic 수익 목표 달성 여부가 산업 전체 투자 심리를 좌우", {
  x: 1.1, y: 3.8, w: 8, h: 0.8,
  fontSize: 13, fontFace: "Arial", color: C.white, valign: "middle",
});

// ========== SLIDE 6: 경쟁사 동향 ==========
const s6 = pres.addSlide();
s6.background = { color: C.white };
s6.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s6.addText("경쟁사 동향", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const competitors = [
  { name: "OpenAI", strategy: "인프라 확보 + 수익화 가속", action: "Cerebras $10B+ 계약" },
  { name: "Google", strategy: "공격적 인수 + 서비스 AI 통합", action: "DeepMind 다수 기업 인수, YouTube AI" },
  { name: "Microsoft", strategy: "개발도구 + 의료·과학 다각화", action: "저장소 인텔리전스, 의료 AI 85.5%" },
  { name: "IBM", strategy: "엔터프라이즈 AI 아키텍처 리더십", action: "초에이전트 개념 주도" },
];

competitors.forEach((c, i) => {
  const y = 1.2 + i * 1.05;
  s6.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 8.4, h: 0.85, fill: { color: i % 2 === 0 ? C.cardBg : C.white }, shadow: makeShadow(),
  });
  s6.addText(c.name, {
    x: 1.0, y, w: 1.5, h: 0.85,
    fontSize: 14, fontFace: "Arial Black", color: C.accent, bold: true, valign: "middle", margin: 0,
  });
  s6.addText(c.strategy, {
    x: 2.5, y, w: 3, h: 0.85,
    fontSize: 12, fontFace: "Arial", color: C.darkText, valign: "middle", margin: 0,
  });
  s6.addText(c.action, {
    x: 5.7, y, w: 3.3, h: 0.85,
    fontSize: 11, fontFace: "Arial", color: C.gray, valign: "middle", margin: 0,
  });
});

// ========== SLIDE 7: 액션 아이템 ==========
const s7 = pres.addSlide();
s7.background = { color: C.white };
s7.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy },
});
s7.addText("액션 아이템", {
  x: 0.8, y: 0.1, w: 8.4, h: 0.7,
  fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true,
});

const actions = [
  { pri: "HIGH", color: "F96167", item: "AI 에이전트 아키텍처 역량 확보", team: "AI팀", due: "Q1" },
  { pri: "HIGH", color: "F96167", item: "SLM/엣지 AI 전환 가능성 검토", team: "개발팀", due: "3월 말" },
  { pri: "MID", color: "F5A623", item: "EU AI 규제 컴플라이언스 점검", team: "법무팀", due: "Q2" },
  { pri: "MID", color: "F5A623", item: "저장소 인텔리전스 도입 검토", team: "개발팀", due: "4월" },
  { pri: "LOW", color: "2C5F2D", item: "오픈소스 AI 파이프라인 구축", team: "AI팀", due: "Q2" },
];

const actHeader = [
  [
    { text: "", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial" } },
    { text: "항목", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 11, fontFace: "Arial" } },
    { text: "담당", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 11, fontFace: "Arial" } },
    { text: "기한", options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 11, fontFace: "Arial" } },
  ],
  ...actions.map((a) => [
    { text: a.pri, options: { fontSize: 10, fontFace: "Arial", color: a.color, bold: true, align: "center" } },
    { text: a.item, options: { fontSize: 11, fontFace: "Arial" } },
    { text: a.team, options: { fontSize: 11, fontFace: "Arial", align: "center" } },
    { text: a.due, options: { fontSize: 11, fontFace: "Arial", align: "center" } },
  ]),
];

s7.addTable(actHeader, {
  x: 0.8, y: 1.2, w: 8.4,
  colW: [0.8, 4.6, 1.2, 1.2],
  border: { pt: 0.5, color: "DEE2E6" },
  rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5],
  autoPage: false,
});

// ========== SLIDE 8: 다음 주 관전 포인트 ==========
const s8 = pres.addSlide();
s8.background = { color: C.navy };
s8.addText("다음 주 관전 포인트", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.8,
  fontSize: 28, fontFace: "Arial Black", color: C.white, bold: true,
});

const watchPoints = [
  { title: "OpenAI·Anthropic 분기 실적", desc: "AI 산업 전체 투자 심리를 좌우할 핵심 지표" },
  { title: "EU AI 규제 샌드박스 최종 확정", desc: "유럽 시장 진출 기업에 직접 영향" },
  { title: "에이전트 커머스 후속 확장", desc: "DBS Bank·Visa 파일럿 이후 본격 상용화 여부" },
];

watchPoints.forEach((w, i) => {
  const y = 1.6 + i * 1.2;
  s8.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 8.4, h: 0.95, fill: { color: "2A3370" },
  });
  s8.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y, w: 0.07, h: 0.95, fill: { color: C.accent },
  });
  s8.addText(w.title, {
    x: 1.2, y: y + 0.08, w: 7.5, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: C.white, bold: true, margin: 0,
  });
  s8.addText(w.desc, {
    x: 1.2, y: y + 0.48, w: 7.5, h: 0.35,
    fontSize: 12, fontFace: "Arial", color: C.ice, margin: 0,
  });
});

s8.addText("AI 테크팀 | 자동 생성 보고서", {
  x: 0.8, y: 5.0, w: 8.4, h: 0.4,
  fontSize: 10, fontFace: "Arial", color: C.gray, align: "right",
});

// ========== SAVE ==========
const outputPath = path.join(__dirname, "주간트렌드_W1.pptx");
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("Created: " + outputPath);
});
