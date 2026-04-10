import type { DISCScores } from "@/components/DISCForm";
import type { UserInfo } from "@/components/UserInfoForm";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, UserRound, Building2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

type DiscKey = keyof DISCScores;

interface DISCResultsProps {
  scores: DISCScores;
  userInfo: UserInfo;
  onReset: () => void;
  resetButtonLabel?: string;
}

interface DimensionMeta {
  name: string;
  description: string;
  strengths: string[];
  attentionPoints: string[];
}

const BASE_PROFILE_COLOR = "hsl(210 100% 64%)";
const BASE_PROFILE_TONE = "210 100% 64%";
const DOMINANT_PROFILE_COLOR = "hsl(150 72% 48%)";
const DOMINANT_PROFILE_TONE = "150 72% 48%";

const dimensionInfo: Record<DiscKey, DimensionMeta> = {
  D: {
    name: "Dominância",
    description: "Direto, decidido, competitivo e focado em resultados.",
    strengths: ["Decisão rápida em cenários de pressão", "Foco em metas e senso de urgência", "Capacidade de assumir liderança"],
    attentionPoints: ["Pode soar impaciente com ritmos mais lentos", "Risco de pular etapas de alinhamento", "Precisa equilibrar firmeza com escuta"],
  },
  I: {
    name: "Influência",
    description: "Comunicativo, entusiasta, otimista e sociável.",
    strengths: ["Facilidade para engajar pessoas", "Comunicação persuasiva e positiva", "Energia para mobilizar o time"],
    attentionPoints: ["Pode dispersar em excesso de estímulos", "Risco de subestimar detalhes técnicos", "Precisa reforçar constância na execução"],
  },
  S: {
    name: "Estabilidade",
    description: "Paciente, leal, estável e bom ouvinte.",
    strengths: ["Confiabilidade e consistência no dia a dia", "Escuta ativa e colaboração genuína", "Boa sustentação de processos"],
    attentionPoints: ["Pode evitar conflitos necessários", "Risco de adiar decisões difíceis", "Precisa exercitar adaptação em mudanças rápidas"],
  },
  C: {
    name: "Conformidade",
    description: "Analítico, preciso, cuidadoso e detalhista.",
    strengths: ["Alto padrão de qualidade e precisão", "Pensamento analítico para resolver problemas", "Critério técnico na tomada de decisão"],
    attentionPoints: ["Pode travar com excesso de análise", "Risco de perfeccionismo em prazos curtos", "Precisa equilibrar criticidade com agilidade"],
  },
};

const quadrantLayout: DiscKey[] = ["D", "I", "C", "S"];
const radarOrder: DiscKey[] = ["D", "I", "S", "C"];

const pairInsights: Partial<Record<`${DiscKey}-${DiscKey}`, { synergy: string; attention: string }>> = {
  "D-I": {
    synergy: "Combina velocidade de decisão com influência para mobilizar pessoas rapidamente.",
    attention: "Pode gerar promessas aceleradas sem detalhar execução e acompanhamento.",
  },
  "D-S": {
    synergy: "Une direção clara com estabilidade, sustentando resultados com constância.",
    attention: "Conflito entre urgência e ritmo estável pode causar tensão em prioridades.",
  },
  "D-C": {
    synergy: "Equilibra foco em resultado com rigor técnico e qualidade nas entregas.",
    attention: "Risco de atrito entre rapidez de decisão e necessidade de validação detalhada.",
  },
  "I-D": {
    synergy: "Tem poder de engajamento alto e energia para converter ideias em ação.",
    attention: "Pode aumentar impulsividade em contextos com metas agressivas e pouca estrutura.",
  },
  "I-S": {
    synergy: "Relacionamento forte com colaboração consistente, favorecendo clima de equipe.",
    attention: "Pode evitar conversas difíceis para preservar harmonia, atrasando ajustes necessários.",
  },
  "I-C": {
    synergy: "Comunicação persuasiva com base analítica, útil para influenciar com dados.",
    attention: "Pode alternar entre excesso de entusiasmo e excesso de cautela.",
  },
  "S-D": {
    synergy: "Entrega estabilidade operacional sem perder direcionamento para objetivos.",
    attention: "Pode haver ambivalência entre manter rotina e acelerar mudanças estratégicas.",
  },
  "S-I": {
    synergy: "Apoio humano consistente com boa capacidade de aproximação e empatia.",
    attention: "Risco de priorizar aceitação social em vez de decisões firmes quando necessário.",
  },
  "S-C": {
    synergy: "Perfil confiável, metódico e orientado a processo com alto padrão de consistência.",
    attention: "Pode reagir lentamente a mudanças rápidas por buscar previsibilidade e controle.",
  },
  "C-D": {
    synergy: "Combina análise criteriosa com orientação a resultado para decisões robustas.",
    attention: "Pode aumentar criticidade e rigidez sob pressão por desempenho.",
  },
  "C-I": {
    synergy: "Une clareza técnica com capacidade de explicar e influenciar diferentes públicos.",
    attention: "Pode oscilar entre detalhamento excessivo e tentativa de agradar expectativas externas.",
  },
  "C-S": {
    synergy: "Favorece qualidade, confiabilidade e execução disciplinada no longo prazo.",
    attention: "Risco de conservadorismo excessivo em cenários que exigem experimentação.",
  },
};

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const scoreOpacity = (score: number, min = 0.32, max = 1) => min + (score / 100) * (max - min);

const DISCResults = ({ scores, userInfo, onReset, resetButtonLabel = "Refazer" }: DISCResultsProps) => {
  const sorted = (Object.entries(scores) as [DiscKey, number][]).sort((a, b) => b[1] - a[1]);
  const dominantKey = sorted[0][0];
  const secondaryKey = sorted[1][0];
  const spread = sorted[0][1] - sorted[sorted.length - 1][1];

  const getProfilePalette = (key: DiscKey) => {
    const isDominant = key === dominantKey;

    return {
      isDominant,
      color: isDominant ? DOMINANT_PROFILE_COLOR : BASE_PROFILE_COLOR,
      tone: isDominant ? DOMINANT_PROFILE_TONE : BASE_PROFILE_TONE,
    };
  };

  const xPos = ((scores.I + scores.S) - (scores.D + scores.C)) / 2;
  const yPos = ((scores.D + scores.I) - (scores.S + scores.C)) / 2;
  const dotX = clampValue(50 + xPos * 0.45, 6, 94);
  const dotY = clampValue(50 - yPos * 0.45, 6, 94);

  const radarData = radarOrder.map((key) => ({
    dim: key,
    value: scores[key],
    fullMark: 100,
  }));

  const rankedData = radarOrder
    .map((key) => ({ key, value: scores[key], ...dimensionInfo[key], ...getProfilePalette(key) }))
    .sort((a, b) => b.value - a.value);

  const dominantProfile = dimensionInfo[dominantKey];
  const secondaryProfile = dimensionInfo[secondaryKey];
  const pairKey = `${dominantKey}-${secondaryKey}` as const;
  const pairInsight = pairInsights[pairKey] ?? {
    synergy: `A combinação entre ${dominantProfile.name} e ${secondaryProfile.name} reforça repertório comportamental complementar para diferentes contextos.`,
    attention: `O principal cuidado é equilibrar as preferências de ${dominantProfile.name} com as exigências de ${secondaryProfile.name} em momentos de pressão.`,
  };

  const handleDownloadPDF = async () => {
    toast.info("Gerando relatório...");

    try {
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF("p", "mm", "a4");
      const reportDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let cursorY = 16;
      const primaryColor: [number, number, number] = [44, 130, 246];
      const highlightColor: [number, number, number] = [34, 197, 94];

      const ensurePageSpace = (minSpace = 28) => {
        if (cursorY > 297 - minSpace) {
          doc.addPage();
          cursorY = 16;
        }
      };

      const drawSectionTitle = (title: string) => {
        ensurePageSpace(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.text(title, 14, cursorY);
        cursorY += 4;
      };

      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 28, 36);
      doc.setFontSize(18);
      doc.text("Relatório Avaliação DISC", 14, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 98, 110);
      doc.setFontSize(10);
      doc.text("RH Usee Brasil", 14, cursorY + 6);
      doc.text(`Data de geração: ${reportDate}`, 14, cursorY + 11);
      cursorY += 18;

      drawSectionTitle("Resumo do Participante");
      autoTable(doc, {
        startY: cursorY,
        head: [["Indicador", "Valor"]],
        body: [
          ["Nome", `${userInfo.nome} ${userInfo.sobrenome}`],
          ["Setor", userInfo.setor],
          ["Idade", userInfo.idade],
          ["Perfil predominante", `${dominantProfile.name} (${scores[dominantKey]}%)`],
          ["Fator de apoio", `${secondaryProfile.name} (${scores[secondaryKey]}%)`],
        ],
        theme: "grid",
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
      });
      cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 7;

      drawSectionTitle("Distribuição de Pontuações DISC");
      autoTable(doc, {
        startY: cursorY,
        head: [["Ordem", "Fator", "Dimensão", "Pontuação", "Classificação"]],
        body: rankedData.map((item, index) => [
          `${index + 1}º`,
          item.key,
          item.name,
          `${item.value}%`,
          item.isDominant ? "Predominante" : item.key === secondaryKey ? "Apoio" : "Complementar",
        ]),
        theme: "grid",
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
        bodyStyles: { textColor: 35 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 4 && data.cell.raw === "Predominante") {
            data.cell.styles.textColor = highlightColor;
            data.cell.styles.fontStyle = "bold";
          }
        },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 7;

      drawSectionTitle("Posicionamento no Quadrante");
      autoTable(doc, {
        startY: cursorY,
        head: [["Métrica", "Valor"]],
        body: [
          ["Leitura geral", spread <= 15 ? "Perfil equilibrado entre fatores" : "Perfil com dominância mais marcada"],
        ],
        theme: "grid",
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 2 },
      });
      cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 7;

      drawSectionTitle("Insights Executivos");
      autoTable(doc, {
        startY: cursorY,
        head: [["Bloco", "Conteúdo"]],
        body: [
          ["Predominante", dominantProfile.description],
          ["Predominante - pontos positivos", dominantProfile.strengths.map((item) => `+ ${item}`).join("\n")],
          ["Predominante - pontos de atenção", dominantProfile.attentionPoints.map((item) => `- ${item}`).join("\n")],
          ["Apoio - pontos positivos", secondaryProfile.strengths.map((item) => `+ ${item}`).join("\n")],
          ["Apoio - pontos de atenção", secondaryProfile.attentionPoints.map((item) => `- ${item}`).join("\n")],
          ["Sinergia predominante + apoio", `${dominantProfile.name} + ${secondaryProfile.name}: ${pairInsight.synergy}`],
          ["Atenção da combinação", pairInsight.attention],
        ],
        theme: "grid",
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8.8, cellPadding: 2, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 58, fontStyle: "bold" }, 1: { cellWidth: 122 } },
      });

      doc.save(`DISC ${userInfo.nome} ${userInfo.sobrenome}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    }
  };

  return (
    <section className="pb-10 pt-1 md:pb-16 md:pt-4">
      <div className="container mx-auto max-w-4xl space-y-6 px-4">
        <div className="space-y-3 text-center animate-fade-in">
          <h2 className="text-2xl font-bold md:text-3xl">
            Avaliação de Perfil <span className="gradient-text">DISC</span>
          </h2>

          <div className="mx-auto flex w-fit items-center gap-2 rounded-xl border border-glass-border/70 bg-secondary/30 px-4 py-2.5">
            <UserRound size={16} className="text-foreground/80" />
            <span className="text-sm font-semibold text-foreground md:text-base">{userInfo.nome} {userInfo.sobrenome}</span>
          </div>

          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-glass-border/70 bg-secondary/25 px-3 py-1">
            <Building2 size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Setor</span>
            <span className="ml-2 text-xs font-semibold text-foreground">{userInfo.setor}</span>
          </div>

          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1.5">
            <span className="text-sm font-semibold" style={{ color: DOMINANT_PROFILE_COLOR }}>
              {dimensionInfo[dominantKey].name}
            </span>
          </div>
        </div>

        <div className="glass animate-scale-in p-4 md:p-7">
          <h3 className="mb-1 text-center text-sm font-semibold text-foreground">Quadrante</h3>

          <div className="relative mx-auto max-w-3xl">
            <div className="relative grid h-[240px] grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl border border-glass-border bg-secondary/25 md:h-[320px]">
              {quadrantLayout.map((key) => {
                const meta = dimensionInfo[key];
                const value = scores[key];
                const palette = getProfilePalette(key);

                return (
                  <div
                    key={key}
                    className="flex flex-col justify-between border border-glass-border/70 p-2.5 backdrop-blur-[1px] transition-all duration-500 md:p-4"
                    style={{
                      opacity: scoreOpacity(value, 0.36, 0.86),
                      background: `linear-gradient(145deg, hsl(${palette.tone} / ${0.12 + value / 460}), hsl(${palette.tone} / ${0.3 + value / 240}))`,
                    }}
                  >
                    <span className="text-[11px] font-semibold tracking-wide text-foreground/90 md:text-xs">{key}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground md:text-sm">{meta.name}</p>
                      <p className="text-lg font-bold md:text-xl" style={{ color: palette.color }}>
                        {value}%
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px bg-foreground/20" />
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-foreground/20" />

              <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-emerald-400/85" style={{ left: `${dotX}%` }} />
              <div className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-emerald-400/85" style={{ top: `${dotY}%` }} />

              <div
                className="pointer-events-none absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/70 bg-emerald-400/35 blur-[1px]"
                style={{ left: `${dotX}%`, top: `${dotY}%` }}
              />

              <div
                className="pointer-events-none absolute z-30 h-6 w-6 rounded-full border-2 border-background bg-emerald-400 shadow-[0_0_32px_hsl(150_72%_48%_/_0.9)] transition-all duration-700"
                style={{ left: `${dotX}%`, top: `${dotY}%`, transform: "translate(-50%, -50%)" }}
              />

              <div
                className="pointer-events-none absolute z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/90 animate-pulse"
                style={{ left: `${dotX}%`, top: `${dotY}%` }}
              />
            </div>

          </div>
        </div>

        <div className="space-y-6">
          <div className="glass animate-fade-in p-4 md:p-7" style={{ animationDelay: "0.05s" }}>
            <h3 className="mb-1 text-center text-sm font-semibold text-foreground">Distribuição</h3>

            <div className="space-y-3">
              {rankedData.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-glass-border/70 bg-secondary/30 p-3 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.03)] transition-all duration-500"
                  style={{ opacity: scoreOpacity(item.value, 0.48, 1) }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-background"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.key}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      {item.isDominant ? (
                        <span className="rounded-md bg-emerald-500/28 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">predominante</span>
                      ) : null}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.value}%`,
                        background: `linear-gradient(90deg, hsl(${item.tone} / 0.62), hsl(${item.tone} / 1))`,
                        boxShadow: `0 0 14px hsl(${item.tone} / 0.45)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass animate-fade-in p-4 md:p-7" style={{ animationDelay: "0.1s" }}>
            <h3 className="mb-1 text-center text-sm font-semibold text-foreground">Radar</h3>

            <div className="h-[270px] rounded-xl border border-glass-border/60 bg-secondary/15 p-2 md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="76%" cy="50%">
                  <PolarGrid stroke="hsl(220 18% 24%)" />
                  <PolarAngleAxis
                    dataKey="dim"
                    tick={(props) => {
                      const value = String(props?.payload?.value ?? "");
                      const xOffset = value === "I" ? 8 : value === "C" ? -8 : 0;
                      const yOffset = value === "S" ? 14 : value === "D" ? -8 : 0;

                      return (
                        <text
                          x={(props?.x ?? 0) + xOffset}
                          y={(props?.y ?? 0) + yOffset}
                          textAnchor="middle"
                          fill="hsl(210 20% 92%)"
                          fontSize={13}
                          fontWeight={700}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} tickCount={6} />
                  <Radar dataKey="fullMark" stroke="hsl(220 18% 20%)" fill="hsl(220 18% 12%)" fillOpacity={0.55} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(210 100% 66%)"
                    fill="hsl(210 100% 64%)"
                    fillOpacity={0.44}
                    strokeWidth={3}
                    dot={{ r: 4.5, strokeWidth: 2, stroke: "hsl(220 25% 6%)", fill: "hsl(210 100% 72%)" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              {radarOrder.map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-glass-border/70 bg-secondary/20 px-2 py-1.5 text-center transition-all"
                  style={{ opacity: scoreOpacity(scores[key], 0.28, 1) }}
                >
                  <span className="font-semibold" style={{ color: getProfilePalette(key).color }}>
                    {key}
                  </span>
                  <span className="ml-1 text-muted-foreground">{scores[key]}%</span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {spread <= 15
                ? "Perfil equilibrado entre fatores DISC, com variação moderada entre os eixos."
                : "Perfil com dominância clara, indicando preferências comportamentais mais marcadas."}
            </p>
          </div>
        </div>

        <div className="glass animate-fade-in p-4 md:p-6" style={{ animationDelay: "0.15s" }}>
          <div className="mb-4 text-center">
            <p className="text-sm leading-relaxed text-foreground/95">
              Perfil predominante:{" "}
              <span className="font-semibold" style={{ color: DOMINANT_PROFILE_COLOR }}>
                {dominantProfile.name}
              </span>{" "}
              - {dominantProfile.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fator de apoio mais forte: <span className="font-semibold text-foreground">{secondaryProfile.name}</span> ({scores[secondaryKey]}%).
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <h4 className="mb-2 text-sm font-semibold text-emerald-300">Pontos positivos do predominante</h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {dominantProfile.strengths.map((item) => (
                  <li key={item} className="leading-relaxed">
                    + {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
              <h4 className="mb-2 text-sm font-semibold text-amber-300">Pontos de atenção do predominante</h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {dominantProfile.attentionPoints.map((item) => (
                  <li key={item} className="leading-relaxed">
                    - {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/8 p-4">
              <h4 className="mb-2 text-sm font-semibold text-sky-300">Pontos positivos do fator de apoio</h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {secondaryProfile.strengths.map((item) => (
                  <li key={item} className="leading-relaxed">
                    + {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-orange-400/30 bg-orange-500/8 p-4">
              <h4 className="mb-2 text-sm font-semibold text-orange-300">Pontos de atenção do fator de apoio</h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {secondaryProfile.attentionPoints.map((item) => (
                  <li key={item} className="leading-relaxed">
                    - {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-glass-border/70 bg-secondary/25 p-4">
            <p className="text-xs leading-relaxed text-foreground/90">
              <span className="font-semibold" style={{ color: DOMINANT_PROFILE_COLOR }}>
                {dominantProfile.name}
              </span>{" "}
              com <span className="font-semibold text-sky-300">{secondaryProfile.name}</span>: {pairInsight.synergy}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Atenção nessa combinação: {pairInsight.attention}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-6 max-w-4xl px-4">
        <div className="flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
          <Button onClick={handleDownloadPDF} variant="outline" className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto">
            <Download size={16} className="mr-2" /> Baixar PDF
          </Button>
          <Button onClick={onReset} variant="outline" className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto">
            <RotateCcw size={16} className="mr-2" /> {resetButtonLabel}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DISCResults;
