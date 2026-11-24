import { AlertTriangle, CheckCircle2, Cpu, Repeat } from "lucide-react";
import { useState } from "react";
import type { RequisicaoIA, SaidaBrutaIA } from "../../core/contracts";
import { descreverModelo, ehErroIA, MODELO_IA_META, motivoFallbackIA, simularIA, validarSaidaIA } from "../../core/ia";
import type { ErroIA } from "../../core/ia";
import { MODOS_FALHA_IA } from "../../core/types";
import type { ModoFalhaIA, RegrasAnaliseAero } from "../../core/types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useRegras, useRepositorio } from "../../hooks/useDados";
import { useModule } from "../../hooks/useModule";

const ROTULO_MODO: Record<ModoFalhaIA, string> = {
  NENHUM: "Nenhum (sucesso normal)",
  EXCECAO: "Exceção interna (crash)",
  TIMEOUT: "Timeout (tempo limite excedido)",
  BAIXA_CONFIANCA: "Baixa confiança (< mínimo)",
  SAIDA_INVALIDA: "Saída inválida (schema corrompido)",
};

/** Resultado de uma execução do simulador: saída bruta, erro tipado ou erro inesperado. */
type Execucao =
  | { tipo: "saida"; saida: SaidaBrutaIA }
  | { tipo: "erro"; erro: ErroIA }
  | { tipo: "inesperado"; mensagem: string };

/**
 * JSON "bruto" fiel: `JSON.stringify` troca NaN e Infinity por `null`, o que esconde
 * a corrupção da saída inválida. Aqui eles aparecem literalmente (o texto não é JSON válido).
 */
function jsonBruto(valor: unknown): string {
  const texto = JSON.stringify(
    valor,
    (_chave, v: unknown) => (typeof v === "number" && !Number.isFinite(v) ? `__${String(v)}__` : v),
    2,
  );
  return texto.replace(/"__(NaN|Infinity|-Infinity)__"/g, "$1");
}

function serializarExecucao(exec: Execucao): string {
  switch (exec.tipo) {
    case "saida":
      return jsonBruto(exec.saida);
    case "erro":
      return jsonBruto({ tipo: exec.erro.tipo, mensagem: exec.erro.message, detalhes: exec.erro.detalhes });
    case "inesperado":
      return exec.mensagem;
  }
}

/** Roda o simulador uma vez, sem deixar nenhuma exceção escapar. */
function executar(requisicao: RequisicaoIA): Execucao {
  try {
    return { tipo: "saida", saida: simularIA(requisicao) };
  } catch (e) {
    if (ehErroIA(e)) return { tipo: "erro", erro: e };
    return { tipo: "inesperado", mensagem: e instanceof Error ? e.message : String(e) };
  }
}

/** Motivo pelo qual o fallback seria acionado, ou `null` se a saída seria aceita. */
function motivoFallback(exec: Execucao, regras: RegrasAnaliseAero): string | null {
  switch (exec.tipo) {
    case "saida":
      return motivoFallbackIA(exec.saida, regras);
    case "erro":
      return `IA falhou (${exec.erro.tipo}): ${exec.erro.message}`;
    case "inesperado":
      return `IA falhou: ${exec.mensagem}`;
  }
}

function dadosParaLog(exec: Execucao): unknown {
  if (exec.tipo === "saida") return exec.saida;
  if (exec.tipo === "erro") return exec.erro.detalhes;
  return undefined;
}

/** Seed válida = inteiro (inclui 0 e negativos). Texto vazio ou decimal é inválido. */
function lerSeed(texto: string): number | null {
  const limpo = texto.trim();
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isInteger(n) ? n : null;
}

/** Tempo limite válido = inteiro positivo, em milissegundos. */
function lerTimeout(texto: string): number | null {
  const limpo = texto.trim();
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function IASandbox() {
  const { pecas, lotes } = useRepositorio();
  const { regras } = useRegras();
  const { log } = useModule("ia");

  const [confianca, setConfianca] = useState(0.85);
  const [modoFalha, setModoFalha] = useState<ModoFalhaIA>("NENHUM");
  const [seedTexto, setSeedTexto] = useState("42");
  const [timeoutTexto, setTimeoutTexto] = useState("2000");
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [determinismo, setDeterminismo] = useState<boolean | null>(null);

  const peca = pecas[0] ?? {
    id: "P-001",
    nome: "Suporte do trem de pouso",
    material: "Titânio",
    pesoKg: 12.4,
    conforme: true,
  };
  const lote = lotes[0] ?? {
    id: "L-001",
    pecaId: peca.id,
    dataLote: "2026-10-01",
    quantidade: 400,
    defeituosos: 4,
    horas: 9,
    temperatura: 200,
    pressao: 6,
  };

  const seed = lerSeed(seedTexto);
  const timeoutMs = lerTimeout(timeoutTexto);
  const entradaValida = seed !== null && timeoutMs !== null;

  const montarRequisicao = (seedNum: number, timeout: number): RequisicaoIA => ({
    dados: lote,
    peca,
    regras,
    seed: seedNum,
    config: {
      modoFalha,
      confianca: modoFalha === "NENHUM" ? confianca : undefined,
      timeoutMs: timeout,
    },
  });

  const executarInferencia = () => {
    if (seed === null || timeoutMs === null) return;
    const exec = executar(montarRequisicao(seed, timeoutMs));
    setExecucao(exec);
    setDeterminismo(null);
    const motivo = motivoFallback(exec, regras);
    const nivel = exec.tipo === "saida" ? (motivo ? "WARN" : "INFO") : "ERROR";
    log(
      nivel,
      `Inferência simulada (seed ${seed}, modo ${modoFalha}): ${motivo ?? "saída aceita."}`,
      dadosParaLog(exec),
    );
  };

  const executarEComparar = () => {
    if (seed === null || timeoutMs === null) return;
    const requisicao = montarRequisicao(seed, timeoutMs);
    const primeira = executar(requisicao);
    const segunda = executar(requisicao);
    const igual = serializarExecucao(primeira) === serializarExecucao(segunda);
    setExecucao(primeira);
    setDeterminismo(igual);
    log(
      igual ? "INFO" : "ERROR",
      `Comparação de 2 execuções (seed ${seed}, modo ${modoFalha}): ${igual ? "idênticas" : "DIFERENTES"}.`,
    );
  };

  const motivo = execucao !== null ? motivoFallback(execucao, regras) : null;
  const problemasSaida = execucao !== null && execucao.tipo === "saida" ? validarSaidaIA(execucao.saida) : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        titulo="Simulador de Inferência (modelo_ia.bin)"
        descricao="Chamada em processo, determinística por seed e sem rede."
      >
        <div className="space-y-3">
          <div className="rounded-md border border-borda bg-navy-900/70 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-slate-200">{descreverModelo()}</span>
              <Badge tom="sucesso">{MODELO_IA_META.status}</Badge>
            </div>
            <p className="mt-1 text-slate-400">
              Precisão nominal {(MODELO_IA_META.precisao * 100).toFixed(0)}%
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slider-confianca" className="flex justify-between text-xs font-medium text-slate-300">
              <span>Confiança reportada</span>
              <span className="font-mono text-cyan-300">{confianca.toFixed(2)}</span>
            </label>
            <input
              id="slider-confianca"
              type="range"
              min="0.1"
              max="0.99"
              step="0.01"
              disabled={modoFalha !== "NENHUM"}
              value={confianca}
              onChange={(e) => setConfianca(Number(e.target.value))}
              className="accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500">
              Mínimo exigido pelas regras: {regras.confiancaMinimaIA.toFixed(2)}
            </span>
            {modoFalha !== "NENHUM" && (
              <span className="text-[11px] text-amber-300">
                Controlada pelo modo de falha selecionado. Para usar o slider, escolha &ldquo;Nenhum&rdquo;.
              </span>
            )}
          </div>

          <Select
            rotulo="Modo de falha"
            opcoes={MODOS_FALHA_IA.map((m) => ({ valor: m, rotulo: ROTULO_MODO[m] }))}
            value={modoFalha}
            onChange={(e) => setModoFalha(e.target.value as ModoFalhaIA)}
          />

          <Input
            rotulo="Seed determinística"
            type="number"
            value={seedTexto}
            onChange={(e) => setSeedTexto(e.target.value)}
            erro={seed === null ? "Informe um número inteiro (ex.: 0, 42, -7)." : undefined}
            dica="Mesma seed + mesma entrada = mesma saída."
          />

          <Input
            rotulo="Tempo limite simulado"
            type="number"
            value={timeoutTexto}
            onChange={(e) => setTimeoutTexto(e.target.value)}
            sufixo="ms"
            erro={timeoutMs === null ? "Informe um inteiro maior que zero." : undefined}
            dica="Usado no modo Timeout."
          />

          <Button
            variante="primario"
            onClick={executarInferencia}
            disabled={!entradaValida}
            icone={<Cpu className="size-4" />}
            className="w-full"
          >
            Executar inferência
          </Button>

          <Button
            variante="secundario"
            onClick={executarEComparar}
            disabled={!entradaValida}
            icone={<Repeat className="size-4" />}
            className="w-full"
          >
            Executar 2× e comparar
          </Button>

          {determinismo !== null && (
            <p
              role="status"
              className={
                determinismo
                  ? "rounded-md border border-emerald-500/40 bg-emerald-950/40 p-2 text-xs text-emerald-200"
                  : "rounded-md border border-red-500/40 bg-red-950/50 p-2 text-xs text-red-200"
              }
            >
              {determinismo
                ? "Determinístico: as 2 execuções foram idênticas."
                : "ATENÇÃO: as 2 execuções diferiram."}
            </p>
          )}
        </div>
      </Card>

      <Card
        titulo="Saída mock e decisão de Fallback"
        descricao="Verifica se o Controlador aceitaria a resposta da IA ou acionaria o fallback determinístico."
        className="lg:col-span-2"
        acoes={
          execucao !== null ? (
            motivo !== null ? (
              <Badge tom="alerta" icone={<AlertTriangle className="size-3.5" />}>
                Fallback seria ACIONADO
              </Badge>
            ) : (
              <Badge tom="sucesso" icone={<CheckCircle2 className="size-3.5" />}>
                Saída aceita (sem fallback)
              </Badge>
            )
          ) : undefined
        }
      >
        {execucao === null && (
          <p className="text-xs text-slate-400">
            Ajuste o modo de falha, a seed ou o slider de confiança e clique em &ldquo;Executar inferência&rdquo;.
          </p>
        )}

        {execucao !== null && (
          <div className="space-y-3">
            {motivo !== null && (
              <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                <p className="font-semibold">Motivo do fallback:</p>
                <p className="mt-1 font-mono">{motivo}</p>
                <p className="mt-2">
                  → O Controlador descarta a saída da IA e usa o cálculo determinístico de reserva.
                </p>
              </div>
            )}

            {execucao.tipo === "saida" && problemasSaida.length > 0 && (
              <div role="alert" className="rounded-md border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200">
                <p className="font-semibold">Saída reprovada no schema:</p>
                <ul className="mt-1 list-disc pl-4">
                  {problemasSaida.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {execucao.tipo === "erro" && (
              <p className="text-xs text-slate-300">
                A IA lançou <span className="font-mono text-red-300">{execucao.erro.tipo}</span>. Tipo, mensagem e
                detalhes (seed, modelo, limites) abaixo.
              </p>
            )}

            <CodeBlock
              titulo={execucao.tipo === "saida" ? "SaidaBrutaIA (JSON bruto)" : "ErroIA (tipo, mensagem e detalhes)"}
              valor={serializarExecucao(execucao)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default IASandbox;