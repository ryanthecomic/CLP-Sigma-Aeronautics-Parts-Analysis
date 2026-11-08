import { Calculator } from "lucide-react";
import { useState } from "react";
import { calcularMetricas } from "../../core/calculations";
import { executarFallback } from "../../core/fallback";
import type { DadosProducaoAero } from "../../core/types";
import { MetricTile, ResultCard } from "../../components/result/ResultCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Input } from "../../components/ui/Input";
import { useRegras } from "../../hooks/useDados";
import { useModule } from "../../hooks/useModule";

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

