import { AlertTriangle, CheckCircle2, Cpu } from "lucide-react";
import { useState } from "react";
import type { SaidaBrutaIA } from "../../core/contracts";
import { ehErroIA, fallbackSeriaAcionado, MODELO_IA_META, simularIA, validarSaidaIA } from "../../core/ia";
import { MODOS_FALHA_IA } from "../../core/types";
import type { ModoFalhaIA } from "../../core/types";
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

export function IASandbox() {
  const { pecas, lotes } = useRepositorio();
  const { regras } = useRegras();
  const { log } = useModule("ia");

  const [confianca, setConfianca] = useState(0.85);
  const [modoFalha, setModoFalha] = useState<ModoFalhaIA>("NENHUM");
  const [seed, setSeed] = useState("42");
  const [saida, setSaida] = useState<SaidaBrutaIA | null>(null);
  const [erroCapturado, setErroCapturado] = useState<string | null>(null);

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

  const executarInferencia = () => {
    setErroCapturado(null);
    setSaida(null);
    const seedNum = Number(seed) || 42;
    try {
      const res = simularIA({
        dados: lote,
        peca,
        regras,
        seed: seedNum,
        config: {
          modoFalha,
          confianca: modoFalha === "NENHUM" ? confianca : undefined,
          timeoutMs: 2000,
        },
      });
      setSaida(res);
      const acionaFallback = fallbackSeriaAcionado(res, regras);
      log(
        acionaFallback ? "WARN" : "INFO",
        `Inferência simulada (seed ${seedNum}, modo ${modoFalha}): confiança ${res.confianca}.`,
        res,
      );
    } catch (e) {
      const msg = ehErroIA(e) ? `[${e.tipo}] ${e.message}` : String(e);
      setErroCapturado(msg);
      log("ERROR", `Falha simulada na IA: ${msg}`);
    }
  };

  const problemasSaida = saida ? validarSaidaIA(saida) : [];
  const acionariaFallback =
    erroCapturado !== null || (saida !== null && fallbackSeriaAcionado(saida, regras));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        titulo="Simulador de Inferência (modelo_ia.bin)"
        descricao="Chamada em processo, determinística por seed e sem rede."
      >
        <div className="space-y-3">
          <div className="rounded-md border border-borda bg-navy-900/70 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-slate-200">{MODELO_IA_META.nome}</span>
              <Badge tom="sucesso">{MODELO_IA_META.status}</Badge>
            </div>
            <p className="mt-1 text-slate-400">
              Versão {MODELO_IA_META.versao} · Precisão nominal {(MODELO_IA_META.precisao * 100).toFixed(0)}%
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
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />

          <Button
            variante="primario"
            onClick={executarInferencia}
            icone={<Cpu className="size-4" />}
            className="w-full"
          >
            Executar inferência
          </Button>
        </div>
      </Card>

      <Card
        titulo="Saída mock e decisão de Fallback"
        descricao="Verifica se o Controlador aceitaria a resposta da IA ou acionaria o fallback determinístico."
        className="lg:col-span-2"
        acoes={
          saida !== null || erroCapturado !== null ? (
            acionariaFallback ? (
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
        {erroCapturado && (
          <div role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200">
            <p className="font-semibold">Exceção lançada pela IA:</p>
            <p className="mt-1 font-mono">{erroCapturado}</p>
            <p className="mt-2 text-amber-200">
              → O Controlador captura este erro e aciona o fallback determinístico automaticamente.
            </p>
          </div>
        )}

        {saida && (
          <div className="space-y-3">
            {problemasSaida.length > 0 && (
              <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                <p className="font-semibold">Saída reprovada no schema:</p>
                <ul className="mt-1 list-disc pl-4">
                  {problemasSaida.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <CodeBlock titulo="SaidaBrutaIA" valor={saida} />
          </div>
        )}

        {!saida && !erroCapturado && (
          <p className="text-xs text-slate-400">
            Ajuste o slider de confiança, o modo de falha ou a seed e clique em &ldquo;Executar inferência&rdquo;.
          </p>
        )}
      </Card>
    </div>
  );
}

export default IASandbox;

