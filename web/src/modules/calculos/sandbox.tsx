import { Calculator } from "lucide-react";
import { useState } from "react";
import { calcularMetricas } from "../../core/calculations";
import { executarFallback, principalDesvio, ROTULOS_DESVIO } from "../../core/fallback";
import type { DadosProducaoAero } from "../../core/types";
import { MetricTile, ResultCard } from "../../components/result/ResultCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Input } from "../../components/ui/Input";
import { useRegras } from "../../hooks/useDados";
import { useModule } from "../../hooks/useModule";

interface CenarioCalculo {
  rotulo: string;
  valores: {
    quantidade: string;
    defeituosos: string;
    horas: string;
    temperatura: string;
    pressao: string;
  };
}

/** Cenários rápidos para demonstrar os três status e a borda térmica. */
const CENARIOS_CALCULO: readonly CenarioCalculo[] = [
  {
    rotulo: "Ótimo",
    valores: { quantidade: "500", defeituosos: "5", horas: "10", temperatura: "200", pressao: "6.5" },
  },
  {
    rotulo: "Atenção",
    valores: { quantidade: "100", defeituosos: "4", horas: "2", temperatura: "200", pressao: "6.5" },
  },
  {
    rotulo: "Crítico (defeitos)",
    valores: { quantidade: "100", defeituosos: "20", horas: "2", temperatura: "200", pressao: "6.5" },
  },
  {
    rotulo: "Crítico (eficiência)",
    valores: { quantidade: "10", defeituosos: "0", horas: "10", temperatura: "200", pressao: "6.5" },
  },
  {
    rotulo: "Borda térmica",
    valores: { quantidade: "500", defeituosos: "0", horas: "10", temperatura: "250", pressao: "6.5" },
  },
];

export function CalculosSandbox() {
  const { regras } = useRegras();
  const { log } = useModule("calculos");
  const [quantidade, setQuantidade] = useState("500");
  const [defeituosos, setDefeituosos] = useState("5");
  const [horas, setHoras] = useState("10");
  const [temperatura, setTemperatura] = useState("200");
  const [pressao, setPressao] = useState("6.5");

  const dados: DadosProducaoAero = {
    id: "L-CALC",
    pecaId: "P-001",
    dataLote: "2026-10-15",
    quantidade: Number(quantidade) || 0,
    defeituosos: Number(defeituosos) || 0,
    horas: Number(horas) || 0,
    temperatura: Number(temperatura) || 0,
    pressao: Number(pressao) || 0,
  };

  const metricas = calcularMetricas(dados, regras);
  const resultadoFallback = executarFallback(dados, regras);
  const desvio = principalDesvio(metricas, dados, regras);

  const aplicarCenario = (cenario: CenarioCalculo) => {
    setQuantidade(cenario.valores.quantidade);
    setDefeituosos(cenario.valores.defeituosos);
    setHoras(cenario.valores.horas);
    setTemperatura(cenario.valores.temperatura);
    setPressao(cenario.valores.pressao);
  };

  const registrarNosLogs = () => {
    log("INFO", `Cálculo determinístico executado: status ${resultadoFallback.status}.`, {
      dados,
      metricas,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          titulo="Entradas de produção"
          descricao="Altere quantidade, defeituosos e horas para ver as métricas e o fallback em tempo real."
          acoes={
            <Button
              variante="secundario"
              tamanho="sm"
              onClick={registrarNosLogs}
              icone={<Calculator className="size-3.5" />}
            >
              Registrar no Log
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Cenários rápidos</p>
              <div className="flex flex-wrap gap-1.5">
                {CENARIOS_CALCULO.map((cenario) => (
                  <Button
                    key={cenario.rotulo}
                    variante="fantasma"
                    tamanho="sm"
                    className="border border-borda"
                    onClick={() => aplicarCenario(cenario)}
                  >
                    {cenario.rotulo}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              rotulo="Quantidade produzida"
              type="number"
              sufixo="pç"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <Input
              rotulo="Peças defeituosas"
              type="number"
              sufixo="pç"
              value={defeituosos}
              onChange={(e) => setDefeituosos(e.target.value)}
            />
            <Input
              rotulo="Horas de produção"
              type="number"
              step="0.5"
              sufixo="h"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                rotulo="Temperatura"
                type="number"
                sufixo="°C"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
              />
              <Input
                rotulo="Pressão"
                type="number"
                step="0.5"
                sufixo="bar"
                value={pressao}
                onChange={(e) => setPressao(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card
          titulo="Métricas calculadas — calcularMetricas(dados)"
          descricao="Fórmulas puras, determinísticas e sem dependência da IA."
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MetricTile
              rotulo="Produtividade"
              valor={`${metricas.produtividade} pç/h`}
              subtitulo="quantidade / horas"
            />
            <MetricTile
              rotulo="Taxa de defeitos"
              valor={`${metricas.taxaDefeitos}%`}
              subtitulo="defeituosos / quantidade × 100"
            />
            <MetricTile
              rotulo="Eficiência"
              valor={`${metricas.eficiencia}%`}
              subtitulo="quantidade / (horas × 50) × 100"
            />
            <MetricTile
              rotulo="Conformidade"
              valor={`${metricas.conformidade}%`}
              subtitulo="100 − taxa de defeitos"
            />
            <MetricTile
              rotulo="Previsão de falhas"
              valor={`${metricas.previsaoFalhas}%`}
              subtitulo="defeitos + desvio T/P"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Badge tom="info">Desvio principal: {ROTULOS_DESVIO[desvio]}</Badge>
            <span>
              Status do fallback: <strong className="text-slate-200">{resultadoFallback.status}</strong>
            </span>
            <span>
              Origem: <strong className="text-slate-200">{resultadoFallback.origem}</strong>
            </span>
          </div>
          <div className="mt-4">
            <CodeBlock titulo="Saída de calcularMetricas" valor={metricas} alturaMax="max-h-48" />
          </div>
        </Card>
      </div>

      <ResultCard
        resultado={resultadoFallback}
        titulo="Resultado do Fallback Determinístico — executarFallback(dados, regras)"
      />
    </div>
  );
}

export default CalculosSandbox;

