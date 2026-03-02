const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "CS팀";
pres.title = "월간보고서 — 2025년 1월";

// Color palette: Midnight Teal
const C = {
  dark: "0F172A",
  primary: "0891B2",
  primaryLight: "06B6D4",
  accent: "22D3EE",
  bg: "F0F9FF",
  white: "FFFFFF",
  text: "1E293B",
  muted: "64748B",
  red: "EF4444",
  amber: "F59E0B",
  green: "10B981",
};

const makeShadow = () => ({
  type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.12,
});

// ============================================================
// Slide 1: Title
// ============================================================
const s1 = pres.addSlide();
s1.background = { color: C.dark };
// Top accent bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary },
});
s1.addText("Monthly Report", {
  x: 0.8, y: 1.2, w: 8.4, h: 0.6,
  fontSize: 16, fontFace: "Arial", color: C.muted, charSpacing: 6,
});
s1.addText("2025년 1월 월간보고서", {
  x: 0.8, y: 1.8, w: 8.4, h: 1.2,
  fontSize: 40, fontFace: "Arial Black", color: C.white, bold: true,
});
s1.addText("CS 성과 분석 및 개선 방안", {
  x: 0.8, y: 3.1, w: 8.4, h: 0.6,
  fontSize: 18, fontFace: "Arial", color: C.accent,
});
// Bottom bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.0, w: 10, h: 0.625, fill: { color: C.primary },
});
s1.addText("CS팀  |  2025.01", {
  x: 0.8, y: 5.05, w: 8.4, h: 0.55,
  fontSize: 13, fontFace: "Arial", color: C.white, align: "right", valign: "middle",
});

// ============================================================
// Slide 2: Executive Summary
// ============================================================
const s2 = pres.addSlide();
s2.background = { color: C.bg };
s2.addText("Executive Summary", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.5,
  fontSize: 11, fontFace: "Arial", color: C.muted, charSpacing: 4, margin: 0,
});
s2.addText("1월 핵심 지표 요약", {
  x: 0.6, y: 0.7, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});

// Stat cards
const stats = [
  { label: "CS 전체평균", value: "4.18", sub: "5.0 만점", color: C.primary },
  { label: "총 VOC 건수", value: "652", sub: "건", color: C.red },
  { label: "최다 불만", value: "배송지연", sub: "215건 (33%)", color: C.amber },
  { label: "CS 최고 주차", value: "4주차", sub: "전체평균 4.30", color: C.green },
];
stats.forEach((s, i) => {
  const cx = 0.6 + i * 2.3;
  // Card background
  s2.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: 1.6, w: 2.1, h: 2.2,
    fill: { color: C.white }, shadow: makeShadow(),
  });
  // Accent top
  s2.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: 1.6, w: 2.1, h: 0.06, fill: { color: s.color },
  });
  s2.addText(s.label, {
    x: cx, y: 1.85, w: 2.1, h: 0.35,
    fontSize: 11, fontFace: "Arial", color: C.muted, align: "center", valign: "middle",
  });
  s2.addText(s.value, {
    x: cx, y: 2.2, w: 2.1, h: 0.8,
    fontSize: 36, fontFace: "Arial Black", color: s.color, bold: true, align: "center", valign: "middle",
  });
  s2.addText(s.sub, {
    x: cx, y: 3.05, w: 2.1, h: 0.35,
    fontSize: 11, fontFace: "Arial", color: C.muted, align: "center", valign: "middle",
  });
});

// Note
s2.addText("* 전월 데이터 없음 — 비교 생략", {
  x: 0.6, y: 4.2, w: 8.8, h: 0.4,
  fontSize: 11, fontFace: "Arial", color: C.muted, italic: true,
});

// ============================================================
// Slide 3: CS 현황 분석 — 월 평균 + 최고/최저
// ============================================================
const s3 = pres.addSlide();
s3.background = { color: C.white };
s3.addText("CS 현황 분석", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 0.85, w: 1.2, h: 0.04, fill: { color: C.primary },
});

// Left: Monthly averages table
s3.addText("월 평균 점수", {
  x: 0.6, y: 1.2, w: 4.2, h: 0.4,
  fontSize: 14, fontFace: "Arial", color: C.text, bold: true, margin: 0,
});
const avgHeader = [
  { text: "지표", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 11, fontFace: "Arial", align: "center", valign: "middle" } },
  { text: "월 평균", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 11, fontFace: "Arial", align: "center", valign: "middle" } },
];
const avgRows = [
  ["상담만족도", "4.08"],
  ["문제해결률", "82.75%"],
  ["응대친절도", "4.28"],
  ["전체평균", "4.18"],
].map(r => r.map(t => ({ text: t, options: { fontSize: 11, fontFace: "Arial", color: C.text, align: "center", valign: "middle" } })));
s3.addTable([avgHeader, ...avgRows], {
  x: 0.6, y: 1.7, w: 4.0, colW: [2.2, 1.8],
  border: { pt: 0.5, color: "CBD5E1" },
  rowH: [0.35, 0.35, 0.35, 0.35, 0.35],
  autoPage: false,
});

// Right: Best/Worst table
s3.addText("최고 / 최저점", {
  x: 5.2, y: 1.2, w: 4.2, h: 0.4,
  fontSize: 14, fontFace: "Arial", color: C.text, bold: true, margin: 0,
});
const hlHeader = [
  { text: "지표", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial", align: "center", valign: "middle" } },
  { text: "최고", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial", align: "center", valign: "middle" } },
  { text: "주차", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial", align: "center", valign: "middle" } },
  { text: "최저", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial", align: "center", valign: "middle" } },
  { text: "주차", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 10, fontFace: "Arial", align: "center", valign: "middle" } },
];
const hlRows = [
  ["상담만족도", "4.2", "4주", "4.0", "1/3주"],
  ["문제해결률", "85%", "4주", "81%", "3주"],
  ["응대친절도", "4.4", "4주", "4.2", "1/3주"],
  ["전체평균", "4.30", "4주", "4.10", "1/3주"],
].map(r => r.map(t => ({ text: t, options: { fontSize: 10, fontFace: "Arial", color: C.text, align: "center", valign: "middle" } })));
s3.addTable([hlHeader, ...hlRows], {
  x: 5.2, y: 1.7, w: 4.2, colW: [1.0, 0.7, 0.6, 0.7, 0.6],
  border: { pt: 0.5, color: "CBD5E1" },
  rowH: [0.35, 0.35, 0.35, 0.35, 0.35],
  autoPage: false,
});

// Insight box
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 3.8, w: 8.8, h: 1.2,
  fill: { color: C.bg },
});
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 3.8, w: 0.06, h: 1.2, fill: { color: C.primary },
});
s3.addText([
  { text: "Insight", options: { bold: true, fontSize: 13, color: C.primary, breakLine: true } },
  { text: "4주차 전 지표 최고점 달성. 3주차 소폭 하락 후 4주차 반등하며 우상향 패턴 확인.", options: { fontSize: 12, color: C.text } },
], {
  x: 0.9, y: 3.9, w: 8.3, h: 1.0, fontFace: "Arial", valign: "middle",
});

// ============================================================
// Slide 4: CS 주차별 추이 (Line Chart)
// ============================================================
const s4 = pres.addSlide();
s4.background = { color: C.white };
s4.addText("CS 주차별 추이", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 0.85, w: 1.2, h: 0.04, fill: { color: C.primary },
});

s4.addChart(pres.charts.LINE, [
  { name: "상담만족도", labels: ["1주차", "2주차", "3주차", "4주차"], values: [4.0, 4.1, 4.0, 4.2] },
  { name: "응대친절도", labels: ["1주차", "2주차", "3주차", "4주차"], values: [4.2, 4.3, 4.2, 4.4] },
  { name: "전체평균", labels: ["1주차", "2주차", "3주차", "4주차"], values: [4.10, 4.20, 4.10, 4.30] },
], {
  x: 0.5, y: 1.2, w: 5.5, h: 3.8,
  lineSize: 3, lineSmooth: true,
  chartColors: [C.primary, C.green, C.amber],
  chartArea: { fill: { color: C.white } },
  catAxisLabelColor: C.muted,
  valAxisLabelColor: C.muted,
  valGridLine: { color: "E2E8F0", size: 0.5 },
  catGridLine: { style: "none" },
  showLegend: true, legendPos: "b", legendFontSize: 10,
  valAxisMinVal: 3.8, valAxisMaxVal: 4.6,
});

// Right side: 문제해결률 bar chart
s4.addChart(pres.charts.BAR, [{
  name: "문제해결률", labels: ["1주차", "2주차", "3주차", "4주차"], values: [82, 83, 81, 85],
}], {
  x: 6.2, y: 1.2, w: 3.5, h: 3.8, barDir: "col",
  chartColors: [C.primaryLight],
  chartArea: { fill: { color: C.white } },
  catAxisLabelColor: C.muted,
  valAxisLabelColor: C.muted,
  valGridLine: { color: "E2E8F0", size: 0.5 },
  catGridLine: { style: "none" },
  showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.text,
  showLegend: true, legendPos: "b", legendFontSize: 10,
  valAxisMinVal: 78, valAxisMaxVal: 88,
});

// ============================================================
// Slide 5: VOC 분석
// ============================================================
const s5 = pres.addSlide();
s5.background = { color: C.white };
s5.addText("VOC 분석", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 0.85, w: 1.2, h: 0.04, fill: { color: C.primary },
});

// Left: Pie chart
s5.addChart(pres.charts.DOUGHNUT, [{
  name: "VOC",
  labels: ["배송지연", "품질불량", "응대지연", "품질불만족", "기타", "배송파손", "응대불친절"],
  values: [215, 105, 95, 76, 65, 59, 37],
}], {
  x: 0.3, y: 1.1, w: 4.8, h: 4.0,
  showPercent: true, showTitle: false,
  chartColors: [C.red, C.amber, C.primary, "8B5CF6", C.muted, "F97316", C.green],
  showLegend: true, legendPos: "b", legendFontSize: 9,
  dataLabelColor: C.text, dataLabelFontSize: 9,
});

// Right: Top 3 cards
s5.addText("Top 3 불만 유형", {
  x: 5.5, y: 1.1, w: 4.0, h: 0.4,
  fontSize: 14, fontFace: "Arial", color: C.text, bold: true, margin: 0,
});

const top3 = [
  { rank: "1", name: "배송지연", count: "215건", pct: "33.0%", color: C.red },
  { rank: "2", name: "품질불량", count: "105건", pct: "16.1%", color: C.amber },
  { rank: "3", name: "응대지연", count: "95건", pct: "14.6%", color: C.primary },
];
top3.forEach((item, i) => {
  const cy = 1.7 + i * 1.1;
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 5.5, y: cy, w: 4.0, h: 0.9,
    fill: { color: C.bg }, shadow: makeShadow(),
  });
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 5.5, y: cy, w: 0.06, h: 0.9, fill: { color: item.color },
  });
  // Rank circle
  s5.addShape(pres.shapes.OVAL, {
    x: 5.75, y: cy + 0.2, w: 0.5, h: 0.5, fill: { color: item.color },
  });
  s5.addText(item.rank, {
    x: 5.75, y: cy + 0.2, w: 0.5, h: 0.5,
    fontSize: 18, fontFace: "Arial Black", color: C.white, bold: true, align: "center", valign: "middle",
  });
  s5.addText(item.name, {
    x: 6.4, y: cy + 0.1, w: 2.0, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: C.text, bold: true, valign: "middle", margin: 0,
  });
  s5.addText(`${item.count}  (${item.pct})`, {
    x: 6.4, y: cy + 0.45, w: 2.0, h: 0.35,
    fontSize: 11, fontFace: "Arial", color: C.muted, valign: "middle", margin: 0,
  });
});

// ============================================================
// Slide 6: VOC 주차별 추이
// ============================================================
const s6 = pres.addSlide();
s6.background = { color: C.white };
s6.addText("VOC 주차별 추이", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});
s6.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 0.85, w: 1.2, h: 0.04, fill: { color: C.primary },
});

s6.addChart(pres.charts.BAR, [
  { name: "배송지연", labels: ["1주차", "2주차", "3주차", "4주차"], values: [55, 58, 52, 50] },
  { name: "품질불량", labels: ["1주차", "2주차", "3주차", "4주차"], values: [30, 28, 25, 22] },
  { name: "응대지연", labels: ["1주차", "2주차", "3주차", "4주차"], values: [25, 28, 22, 20] },
  { name: "기타", labels: ["1주차", "2주차", "3주차", "4주차"], values: [63, 72, 55, 47] },
], {
  x: 0.5, y: 1.1, w: 9.0, h: 3.5, barDir: "col", barGrouping: "stacked",
  chartColors: [C.red, C.amber, C.primary, C.muted],
  chartArea: { fill: { color: C.white } },
  catAxisLabelColor: C.muted,
  valAxisLabelColor: C.muted,
  valGridLine: { color: "E2E8F0", size: 0.5 },
  catGridLine: { style: "none" },
  showLegend: true, legendPos: "b", legendFontSize: 10,
});

// Total callout
s6.addText("2주차 VOC 최다(186건) → 이후 감소세. 4주차 CS 최고와 VOC 최저 일치.", {
  x: 0.6, y: 4.8, w: 8.8, h: 0.4,
  fontSize: 11, fontFace: "Arial", color: C.muted, italic: true,
});

// ============================================================
// Slide 7: 개선 방안
// ============================================================
const s7 = pres.addSlide();
s7.background = { color: C.bg };
s7.addText("개선 방안", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true, margin: 0,
});
s7.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 0.85, w: 1.2, h: 0.04, fill: { color: C.primary },
});

const actions = [
  { priority: "HIGH", prColor: C.red, title: "배송지연 개선", desc: "VOC 1위 (33%), 매주 50건+\n물류 파트너 SLA 재협상\n배송 추적 알림 강화" },
  { priority: "HIGH", prColor: C.red, title: "문제해결률 향상", desc: "현 82.75%, 목표 대비 미달\n상담사 트러블슈팅 가이드 업데이트\nFAQ 확충" },
  { priority: "MID", prColor: C.amber, title: "품질불량 대응", desc: "VOC 2위 (16.1%)\nQC 프로세스 점검\n반품 기준 명확화" },
  { priority: "MID", prColor: C.amber, title: "응대지연 해소", desc: "VOC 3위 (14.6%)\n대기시간 모니터링\n피크타임 인력 보강" },
];

actions.forEach((a, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const cx = 0.6 + col * 4.6;
  const cy = 1.2 + row * 2.0;

  s7.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cy, w: 4.2, h: 1.8,
    fill: { color: C.white }, shadow: makeShadow(),
  });
  s7.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cy, w: 4.2, h: 0.06, fill: { color: a.prColor },
  });
  // Priority badge
  s7.addShape(pres.shapes.RECTANGLE, {
    x: cx + 0.15, y: cy + 0.2, w: 0.6, h: 0.28,
    fill: { color: a.prColor },
  });
  s7.addText(a.priority, {
    x: cx + 0.15, y: cy + 0.2, w: 0.6, h: 0.28,
    fontSize: 8, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle",
  });
  s7.addText(a.title, {
    x: cx + 0.9, y: cy + 0.15, w: 3.1, h: 0.35,
    fontSize: 14, fontFace: "Arial", color: C.text, bold: true, valign: "middle", margin: 0,
  });
  s7.addText(a.desc, {
    x: cx + 0.15, y: cy + 0.6, w: 3.9, h: 1.05,
    fontSize: 11, fontFace: "Arial", color: C.muted, valign: "top", margin: 0,
  });
});

// ============================================================
// Slide 8: 다음 달 계획 + 마무리
// ============================================================
const s8 = pres.addSlide();
s8.background = { color: C.dark };
s8.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary },
});
s8.addText("2월 실행 계획", {
  x: 0.6, y: 0.3, w: 8.8, h: 0.6,
  fontSize: 28, fontFace: "Arial Black", color: C.white, bold: true, margin: 0,
});

const plans = [
  { week: "1주", items: "물류 파트너 미팅 — 배송지연 개선안 협의\n상담사 문제해결 교육 세션 진행" },
  { week: "2주", items: "QC 체크리스트 개정 및 현장 적용" },
  { week: "3주", items: "피크타임 응대인력 배치 조정 시범 운영" },
  { week: "4주", items: "2월 CS/VOC 중간 점검 및 1월 대비 성과 확인" },
];

plans.forEach((p, i) => {
  const cy = 1.2 + i * 0.9;
  // Week badge
  s8.addShape(pres.shapes.OVAL, {
    x: 0.8, y: cy + 0.1, w: 0.6, h: 0.6,
    fill: { color: C.primary },
  });
  s8.addText(p.week, {
    x: 0.8, y: cy + 0.1, w: 0.6, h: 0.6,
    fontSize: 11, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle",
  });
  // Connector line
  if (i < plans.length - 1) {
    s8.addShape(pres.shapes.LINE, {
      x: 1.1, y: cy + 0.7, w: 0, h: 0.3,
      line: { color: C.primary, width: 2 },
    });
  }
  s8.addText(p.items, {
    x: 1.7, y: cy, w: 7.5, h: 0.8,
    fontSize: 13, fontFace: "Arial", color: "CBD5E1", valign: "middle", margin: 0,
  });
});

// Target box
s8.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 4.7, w: 8.8, h: 0.7,
  fill: { color: C.primary }, transparency: 20,
});
s8.addText("2월 목표:  전체평균 4.25 이상  |  VOC 총건수 620건 이하", {
  x: 0.8, y: 4.7, w: 8.4, h: 0.7,
  fontSize: 16, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle",
});

// Write file
pres.writeFile({ fileName: "보고서/월간보고서_1월.pptx" })
  .then(() => console.log("PPTX created: 보고서/월간보고서_1월.pptx"))
  .catch(err => console.error(err));
