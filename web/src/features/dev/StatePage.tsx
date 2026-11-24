import { montarConfig, paraToml } from "../../core/config";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Tabs } from "../../components/ui/Tabs";
import { useRegras, useRepositorio } from "../../hooks/useDados";
import { useFlags } from "../../hooks/useFlags";

const CATALOGO_CONTRATOS = [
  {
    nome: "StatusQualidade",
    dono: "Membro 1 (Modelo)",
    assinatura: 'type StatusQualidade = "OTIMO" | "ATENCAO" | "CRITICO";',
  },
  {
    nome: "PecaAeronautica",
    dono: "Membro 1 (Modelo)",
    assinatura: "{ id: string; nome: string; material: string; pesoKg: number; conforme: boolean }",
  },
  {
    nome: "DadosProducaoAero",
    dono: "Membro 1 (Modelo)",
    assinatura:
      "{ id: string; pecaId: string; dataLote: string; quantidade: number; defeituosos: number; horas: number; temperatura: number; pressao: number }",
  },
  {
    nome: "RegrasAnaliseAero",
    dono: "Membro 1 (Modelo)",
    assinatura:
      "{ temperaturaMin: number; temperaturaMax: number; pressaoMin: number; pressaoMax: number; confiancaMinimaIA: number; ... }",
  },
  {
    nome: "PipelineStep",
    dono: "Membro 2 (Controlador)",
    assinatura:
      '{ id: string; label: string; modulo: "VIEW" | "CONTROLLER" | "MODEL" | "CALC" | "IA" | "REPO"; status: StatusPasso; duracaoMs: number; motivo?: string; entrada?: unknown; saida?: unknown }',
  },
  {
    nome: "ResultadoAnalise",
    dono: "Membro 1 / Membro 2",
    assinatura:
      '{ id: string; loteId: string; status: StatusQualidade; produtividade: number; taxaDefeitos: number; eficiencia: number; conformidade: number; previsaoFalhas: number; recomendacao: string; origem: "IA" | "FALLBACK" | "VALIDACAO"; confianca: number; traceId: string; passos: PipelineStep[] }',
  },
  {
    nome: "LogEvent",
    dono: "Membro 2 (Controlador)",
    assinatura:
      '{ id: string; timestamp: string; nivel: "DEBUG" | "INFO" | "WARN" | "ERROR"; modulo: ModuloSistema; mensagem: string; traceId?: string; payload?: unknown }',
  },
  {
    nome: "AnalysisEngine",
    dono: "Membro 3 (Cálculos)",
    assinatura: "{ calcularMetricas(dados, regras); classificar(metricas, regras); executarFallback(dados, regras) }",
  },
  {
    nome: "AIProvider",
    dono: "Membro 4 (IA)",
    assinatura: "{ readonly meta: ModeloIAMeta; inferir(requisicao: RequisicaoIA): Promise<SaidaBrutaIA> }",
  },
  {
    nome: "Repository",
    dono: "Membro 5 (Repositório)",
    assinatura:
      "{ readonly chave: string; carregar(); buscarPeca(id); buscarLote(id); registrarResultado(r); listarResultados(); remover(colecao, id); reset() }",
  },
];

export function StatePage() {
  const { pecas, lotes, resultados, chave } = useRepositorio();
  const { regras } = useRegras();
  const { flags } = useFlags();

  const estadoAtual = {
    chaveStorage: chave,
    pecas,
    lotes,
    resultados,
    regras,
    flags,
  };

  const configObj = montarConfig(regras, flags);
  const configToml = paraToml(configObj);

  return (
    <div>
      <PageHeader
        titulo="Estado & Contratos"
        descricao="Inspeção do estado persistido, catálogo de contratos congelados do core e prévia do config.toml."
      />

      <Tabs
        rotuloAcessivel="Abas de Estado e Contratos"
        abas={[
          {
            id: "estado",
            rotulo: "Estado atual",
            conteudo: <CodeBlock titulo="Estado completo (peças, lotes, resultados, regras e flags)" valor={estadoAtual} />,
          },
          {
            id: "contratos",
            rotulo: "Contratos",
            conteudo: (
              <div className="space-y-3">
                <Card
                  titulo="Contratos do Core (src/core/types.ts & src/core/contracts.ts)"
                  descricao="Congelados após a Fase 0. Mudanças exigem revisão do Membro 1 e do Membro 2."
                >
                  <div className="space-y-2">
                    {CATALOGO_CONTRATOS.map((c) => (
                      <div key={c.nome} className="rounded-md border border-borda bg-navy-900/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-cyan-300">{c.nome}</span>
                          <span className="text-[11px] text-slate-400">{c.dono}</span>
                        </div>
                        <pre className="mt-1.5 overflow-x-auto font-mono text-xs text-slate-300">
                          <code>{c.assinatura}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </Card>
                <CodeBlock titulo="Catálogo de contratos (JSON)" valor={CATALOGO_CONTRATOS} />
              </div>
            ),
          },
          {
            id: "config",
            rotulo: "Config",
            conteudo: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CodeBlock titulo="Configuração (JSON)" valor={configObj} />
                <CodeBlock titulo="config.toml (prévia Rust)" valor={configToml} linguagem="toml" />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

