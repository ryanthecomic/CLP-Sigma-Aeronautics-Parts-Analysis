import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { MODULOS } from "../../modules/registry";

const EXEMPLO_MANIFEST = `import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const meuModuloManifest: ReactModuleManifest = {
  id: "meu-modulo",
  nome: "Meu Módulo",
  responsavel: "Membro X",
  descricao: "Descrição objetiva do módulo.",
  status: "em_andamento",
  camada: "VIEW",
  contratos: ["PecaAeronautica", "ResultadoAnalise"],
  sandbox: lazy(() => import("./sandbox")),
};`;

const EXEMPLO_USO_HOOKS = `import { useAnalysis } from "../../hooks/useAnalysis";
import { useModule } from "../../hooks/useModule";

export function MeuSandbox() {
  const { analisar, ultimoResultado } = useAnalysis();
  const { log } = useModule("meu-modulo");

  const testar = async () => {
    log("INFO", "Disparando análise de teste pelo sandbox.");
    await analisar({
      pecaId: "P-001",
      dataLote: "2026-10-15",
      quantidade: 500,
      defeituosos: 5,
      horas: 10,
      temperatura: 205,
      pressao: 6.5,
    });
  };
  // ...
}`;

export function DocsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Documentação da Equipe Sigma"
        descricao="Guia rápido de arquitetura, convenções, contratos e definição de pronto para trabalho paralelo."
      />

      <Card
        titulo="1. Como adicionar ou evoluir um módulo"
        descricao="Cada membro é dono de sua pasta em src/modules/<seu-modulo>/."
      >
        <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-300">
          <li>Crie ou edite sua pasta em <code className="font-mono text-cyan-300">src/modules/&lt;id&gt;/</code> contendo <code className="font-mono">manifest.ts</code>, <code className="font-mono">sandbox.tsx</code> e <code className="font-mono">README.md</code>.</li>
          <li>Exporte o componente do sandbox como default em <code className="font-mono">sandbox.tsx</code> para carregamento com <code className="font-mono">React.lazy</code>.</li>
          <li>Registre o manifest em <code className="font-mono text-cyan-300">src/modules/registry.ts</code>. O Hub e a Sidebar leem automaticamente desse registro.</li>
          <li>Importe apenas <code className="font-mono">src/core/</code>, <code className="font-mono">src/components/</code>, <code className="font-mono">src/hooks/</code> e arquivos da própria pasta do módulo.</li>
        </ol>
        <div className="mt-3">
          <CodeBlock titulo="Exemplo de manifest.ts" valor={EXEMPLO_MANIFEST} linguagem="ts" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card titulo="2. Convenções de pastas e regras de ouro">
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-300">
            <li><code className="font-mono text-cyan-300">src/core/</code>: TypeScript puro. <strong>Proibido importar React</strong>.</li>
            <li><code className="font-mono text-cyan-300">src/modules/*/</code>: 7 módulos independentes; um módulo nunca importa outro módulo.</li>
            <li><code className="font-mono text-cyan-300">src/features/dev/</code>: shell do Modo Desenvolvedor; conhece apenas <code className="font-mono">registry.ts</code>.</li>
            <li><code className="font-mono text-cyan-300">src/components/</code>: UI kit, formulários e cards compartilhados.</li>
            <li><code className="font-mono text-cyan-300">localStorage</code>: acessado <strong>somente</strong> pelo Repositório (<code className="font-mono">aerolyze-lab:v1</code>).</li>
          </ul>
        </Card>

        <Card titulo="3. Definição de pronto de um módulo (DoD)">
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-300">
            <li>Sandbox abre sem erros e funciona isoladamente.</li>
            <li><code className="font-mono">manifest.ts</code> atualizado com responsável, status e contratos listados.</li>
            <li>Eventos emitidos no event bus com a camada correta via <code className="font-mono">useModule(id)</code>.</li>
            <li>Código tipado sem <code className="font-mono">any</code>.</li>
            <li><code className="font-mono">README.md</code> do módulo atualizado e <code className="font-mono">npm run test</code> + <code className="font-mono">npm run build</code> passando.</li>
          </ul>
        </Card>
      </div>

      <Card
        titulo="4. Como usar o Motor Mock e o Event Bus"
        descricao="Fluxo unidirecional: UI → hook → mockEngine → eventBus → store → UI."
      >
        <CodeBlock titulo="Uso dos hooks de fachada" valor={EXEMPLO_USO_HOOKS} linguagem="tsx" />
      </Card>

      <Card titulo="5. Mapa dos 7 Módulos e Contratos">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-borda text-slate-400">
                <th className="py-2 pr-3 font-medium">Módulo</th>
                <th className="py-2 pr-3 font-medium">Responsável</th>
                <th className="py-2 pr-3 font-medium">Camada</th>
                <th className="py-2 pr-3 font-medium">Pasta</th>
                <th className="py-2 font-medium">Contratos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {MODULOS.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-3 font-medium text-slate-100">{m.nome}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{m.responsavel}</td>
                  <td className="py-2.5 pr-3">
                    <Badge tom="neutro">{m.camada}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-cyan-300">src/modules/{m.id}/</td>
                  <td className="py-2.5 font-mono text-slate-300">{m.contratos.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

