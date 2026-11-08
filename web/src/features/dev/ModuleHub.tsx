import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { MODULOS } from "../../modules/registry";
import { ModuleCard } from "./ModuleCard";

export function ModuleHub() {
  return (
    <div>
      <PageHeader
        titulo="Hub de Módulos — Equipe Sigma"
        descricao="Ambiente isolado para cada um dos 7 membros desenvolver e testar seu módulo contra contratos congelados e motor mock compartilhado."
        meta={<Badge tom="info">{MODULOS.length} módulos ativos</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((modulo) => (
          <ModuleCard key={modulo.id} modulo={modulo} />
        ))}
      </div>
    </div>
  );
}

