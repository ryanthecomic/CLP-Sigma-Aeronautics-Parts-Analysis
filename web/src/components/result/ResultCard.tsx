/**
 * Componentes de resultado, status e alertas.
 *
 * Dono: Membro 7 (View de Dashboard). Reutilizados pelo sandbox de
 * Dashboard e pelo Preview do Operador.
 *
 * Regra de acessibilidade: a cor NUNCA é o único indicador de status —
 * sempre há ícone e texto.
 */
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { REGRAS_PADRAO, ROTULO_STATUS } from "../../core/rules";
import type {
  OrigemResultado,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusQualidade,
} from "../../core/types";
import { Badge } from "../ui/Badge";
import type { TomBadge } from "../ui/Badge";
import { cx } from "../ui/cx";

const CONFIG_STATUS: Record<
  StatusQualidade,
  { tom: TomBadge; icone: typeof CheckCircle2; borda: string; destaque: string }
> = {
  OTIMO: {
    tom: "sucesso",
    icone: CheckCircle2,
    borda: "border-emerald-500/40",
    destaque: "text-emerald-300",
  },
  ATENCAO: {
    tom: "alerta",
    icone: AlertTriangle,
    borda: "border-amber-500/40",
    destaque: "text-amber-300",
  },
  CRITICO: {
    tom: "perigo",
    icone: AlertOctagon,
    borda: "border-red-500/50",
    destaque: "text-red-300",
  },
};

const ROTULO_ORIGEM: Record<OrigemResultado, { texto: string; tom: TomBadge }> = {
  IA: { texto: "Origem: IA", tom: "acento" },
  FALLBACK: { texto: "Origem: Fallback", tom: "alerta" },
  VALIDACAO: { texto: "Rejeitado na validação", tom: "perigo" },
};

export interface StatusBadgeProps {
  status: StatusQualidade;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { tom, icone: Icone } = CONFIG_STATUS[status];
  return (
    <Badge tom={tom} icone={<Icone className="size-3.5" aria-hidden />}>
      Status: {ROTULO_STATUS[status]} ({status})
    </Badge>
  );
}

export interface QualityAlertProps {
  resultado: Pick<ResultadoAnalise, "status" | "loteId" | "recomendacao" | "erros">;
}

/** Alerta exibido quando o resultado é CRÍTICO. */
export function QualityAlert({ resultado }: QualityAlertProps) {
  if (resultado.status !== "CRITICO") return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/50 p-3.5 text-xs text-red-100"
    >
      <AlertOctagon className="mt-0.5 size-5 shrink-0 text-red-300" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold text-red-200">
          Alerta de qualidade — lote {resultado.loteId} em estado Crítico
        </p>
        <p className="text-red-200/90">{resultado.recomendacao}</p>
        {resultado.erros.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4 text-red-200">
            {resultado.erros.map((e) => (
              <li key={`${e.codigo}-${e.campo}`}>
                <span className="font-mono">[{e.codigo}]</span> {e.mensagem}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export interface MetricTileProps {
  rotulo: string;
  valor: string;
  subtitulo?: string;
}

export function MetricTile({ rotulo, valor, subtitulo }: MetricTileProps) {
  return (
    <div className="rounded-md border border-borda bg-navy-900/70 p-3">
      <p className="text-xs text-slate-400">{rotulo}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-100">{valor}</p>
      {subtitulo && <p className="mt-0.5 text-[11px] text-slate-500">{subtitulo}</p>}
    </div>
  );
}

export interface ResultCardProps {
  resultado: ResultadoAnalise;
  titulo?: string;
  /** Regras vigentes, usadas nos limiares exibidos. Padrão: `REGRAS_PADRAO`. */
  regras?: RegrasAnaliseAero;
}

export function ResultCard({
  resultado,
  titulo = "Resultado da análise",
  regras = REGRAS_PADRAO,
}: ResultCardProps) {
  const { borda, destaque, icone: Icone } = CONFIG_STATUS[resultado.status];
  const origem = ROTULO_ORIGEM[resultado.origem];

  return (
    <section className={cx("rounded-lg border bg-grafite-800 p-4 space-y-4", borda)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icone className={cx("size-5", destaque)} aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{titulo}</h2>
            <p className="font-mono text-xs text-slate-400">
              Lote {resultado.loteId} · trace {resultado.traceId || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={resultado.status} />
          <Badge tom={origem.tom}>{origem.texto}</Badge>
          {/* Rejeitado na validação: a IA não foi executada, então não há confiança a exibir. */}
          {resultado.origem !== "VALIDACAO" && (
            <Badge tom="neutro">Confiança: {(resultado.confianca * 100).toFixed(0)}%</Badge>
          )}
        </div>
      </header>

      <QualityAlert resultado={resultado} />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <MetricTile rotulo="Produtividade" valor={`${resultado.produtividade} pç/h`} subtitulo="quantidade / horas" />
        <MetricTile rotulo="Taxa de defeitos" valor={`${resultado.taxaDefeitos}%`} subtitulo={`≤ ${regras.taxaDefeitosOtimo}% ótimo · ≤ ${regras.taxaDefeitosAtencao}% atenção`} />
        <MetricTile rotulo="Eficiência" valor={`${resultado.eficiencia}%`} subtitulo={`≥ ${regras.eficienciaOtimo}% ótimo · ≥ ${regras.eficienciaAtencao}% atenção`} />
        <MetricTile rotulo="Conformidade" valor={`${resultado.conformidade}%`} subtitulo="100 − taxa de defeitos" />
        <MetricTile rotulo="Previsão de falhas" valor={`${resultado.previsaoFalhas}%`} subtitulo="defeitos + desvio T/P" />
      </div>

      <div className="rounded-md border border-borda bg-navy-900/60 p-3">
        <p className="text-xs font-medium text-slate-300">Recomendação</p>
        <p className="mt-1 text-sm text-slate-200">{resultado.recomendacao}</p>
      </div>
    </section>
  );
}

export interface AnalysisHistoryListProps {
  resultados: ResultadoAnalise[];
  limite?: number;
  onSelecionar?: (resultado: ResultadoAnalise) => void;
  selecionadoId?: string;
}

/** Histórico curto (últimas 5 análises por padrão). */
export function AnalysisHistoryList({
  resultados,
  limite = 5,
  onSelecionar,
  selecionadoId,
}: AnalysisHistoryListProps) {
  const itens = resultados.slice(0, limite);
  if (itens.length === 0) {
    return <p className="text-xs text-slate-400">Nenhuma análise executada nesta sessão.</p>;
  }
  return (
    <ul className="divide-y divide-borda rounded-md border border-borda bg-navy-900/50">
      {itens.map((r) => {
        const ativo = r.id === selecionadoId;
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelecionar?.(r)}
              className={cx(
                "flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors",
                ativo ? "bg-cyan-500/10" : "hover:bg-grafite-700/60",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-200">{r.loteId}</span>
                <span className="text-slate-400">
                  defeitos {r.taxaDefeitos}% · efic. {r.eficiencia}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge tom="neutro">{r.origem}</Badge>
                <StatusBadge status={r.status} />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

