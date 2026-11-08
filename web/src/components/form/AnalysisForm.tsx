/**
 * Formulário de captura de dados e modal "Configurar Limites".
 *
 * Dono: Membro 6 (View de Entrada). Reutilizado pelo sandbox de View de
 * Entrada e pelo Preview do Operador.
 *
 * Nenhum cálculo ou limite de domínio é duplicado aqui: o schema Zod vem
 * de `src/core/schemas.ts`, construído a partir das regras na store.
 */
import { Play, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { REGRAS_PADRAO } from "../../core/rules";
import { converterSemValidar, validarFormulario } from "../../core/schemas";
import type { ErrosFormulario, ValoresFormularioAnalise } from "../../core/schemas";
import type { AnaliseInput, PecaAeronautica, RegrasAnaliseAero } from "../../core/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export const VALORES_INICIAIS_FORM: ValoresFormularioAnalise = {
  pecaId: "P-001",
  dataLote: "2026-10-15",
  quantidade: "500",
  defeituosos: "5",
  horas: "10",
  temperatura: "205",
  pressao: "6.5",
};

export interface AnalysisFormProps {
  pecas: PecaAeronautica[];
  regras: RegrasAnaliseAero;
  executando?: boolean;
  valoresIniciais?: ValoresFormularioAnalise;
  /** Permite enviar mesmo inválido, para testar a rejeição no Controlador. */
  permitirEnvioBruto?: boolean;
  onAnalisar: (input: AnaliseInput) => void | Promise<unknown>;
  onAbrirLimites?: () => void;
}

export function AnalysisForm({
  pecas,
  regras,
  executando = false,
  valoresIniciais = VALORES_INICIAIS_FORM,
  permitirEnvioBruto = false,
  onAnalisar,
  onAbrirLimites,
}: AnalysisFormProps) {
  const [valores, setValores] = useState<ValoresFormularioAnalise>(valoresIniciais);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [tocado, setTocado] = useState<Partial<Record<keyof ValoresFormularioAnalise, boolean>>>({});

  const atualizar = (campo: keyof ValoresFormularioAnalise, valor: string) => {
    const proximo = { ...valores, [campo]: valor };
    setValores(proximo);
    setTocado((t) => ({ ...t, [campo]: true }));
    const res = validarFormulario(proximo, regras);
    setErros(res.erros);
  };

  const aoSubmeter = (e: FormEvent) => {
    e.preventDefault();
    setTocado({
      pecaId: true,
      dataLote: true,
      quantidade: true,
      defeituosos: true,
      horas: true,
      temperatura: true,
      pressao: true,
    });
    const res = validarFormulario(valores, regras);
    setErros(res.erros);
    if (!res.ok) return;
    void onAnalisar(res.input);
  };

  const erroDe = (campo: keyof ValoresFormularioAnalise): string | undefined =>
    tocado[campo] ? erros[campo] : undefined;

  const opcoesPeca = pecas.map((p) => ({
    valor: p.id,
    rotulo: `${p.id} — ${p.nome}${p.conforme ? "" : " (não conforme)"}`,
  }));

  return (
    <form onSubmit={aoSubmeter} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          rotulo="Peça aeronáutica"
          placeholder="Selecione uma peça..."
          opcoes={opcoesPeca}
          value={valores.pecaId}
          erro={erroDe("pecaId")}
          onChange={(e) => atualizar("pecaId", e.target.value)}
        />
        <Input
          rotulo="Data do lote"
          type="date"
          value={valores.dataLote}
          erro={erroDe("dataLote")}
          onChange={(e) => atualizar("dataLote", e.target.value)}
        />
        <Input
          rotulo="Quantidade produzida"
          type="number"
          min={1}
          step={1}
          sufixo="pç"
          value={valores.quantidade}
          erro={erroDe("quantidade")}
          onChange={(e) => atualizar("quantidade", e.target.value)}
        />
        <Input
          rotulo="Peças defeituosas"
          type="number"
          min={0}
          step={1}
          sufixo="pç"
          value={valores.defeituosos}
          erro={erroDe("defeituosos")}
          onChange={(e) => atualizar("defeituosos", e.target.value)}
        />
        <Input
          rotulo="Tempo de produção"
          type="number"
          min={0.5}
          step={0.5}
          sufixo="h"
          value={valores.horas}
          erro={erroDe("horas")}
          onChange={(e) => atualizar("horas", e.target.value)}
        />
        <Input
          rotulo="Temperatura do processo"
          type="number"
          step={1}
          sufixo="°C"
          dica={`Faixa: ${regras.temperaturaMin} a ${regras.temperaturaMax} °C`}
          value={valores.temperatura}
          erro={erroDe("temperatura")}
          onChange={(e) => atualizar("temperatura", e.target.value)}
        />
        <Input
          rotulo="Pressão do processo"
          type="number"
          step={0.1}
          sufixo="bar"
          dica={`Faixa: ${regras.pressaoMin} a ${regras.pressaoMax} bar`}
          value={valores.pressao}
          erro={erroDe("pressao")}
          onChange={(e) => atualizar("pressao", e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variante="primario"
            carregando={executando}
            icone={<Play className="size-4" aria-hidden />}
          >
            Analisar
          </Button>
          {permitirEnvioBruto && (
            <Button
              variante="secundario"
              disabled={executando}
              onClick={() => void onAnalisar(converterSemValidar(valores))}
            >
              Enviar direto ao Controlador
            </Button>
          )}
        </div>
        {onAbrirLimites && (
          <Button
            variante="fantasma"
            tamanho="sm"
            onClick={onAbrirLimites}
            icone={<SlidersHorizontal className="size-3.5" aria-hidden />}
          >
            Configurar Limites
          </Button>
        )}
      </div>
    </form>
  );
}

export interface LimitsModalProps {
  aberto: boolean;
  regras: RegrasAnaliseAero;
  onFechar: () => void;
  onSalvar: (regras: RegrasAnaliseAero) => void;
}

export function LimitsModal({ aberto, regras, onFechar, onSalvar }: LimitsModalProps) {
  const [form, setForm] = useState<RegrasAnaliseAero>(regras);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    if (form.temperaturaMin >= form.temperaturaMax) {
      setErro("A temperatura mínima deve ser menor que a máxima.");
      return;
    }
    if (form.pressaoMin >= form.pressaoMax) {
      setErro("A pressão mínima deve ser menor que a máxima.");
      return;
    }
    if (form.confiancaMinimaIA < 0 || form.confiancaMinimaIA > 1) {
      setErro("A confiança mínima deve estar entre 0 e 1.");
      return;
    }
    setErro(null);
    onSalvar(form);
    onFechar();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-limites"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-borda bg-grafite-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-borda px-4 py-3">
          <h2 id="titulo-modal-limites" className="text-sm font-semibold text-slate-100">
            Configurar Limites de Análise
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar modal"
            className="rounded p-1 text-slate-400 hover:bg-grafite-700 hover:text-slate-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              rotulo="Temperatura mín."
              type="number"
              sufixo="°C"
              value={form.temperaturaMin}
              onChange={(e) => setForm({ ...form, temperaturaMin: Number(e.target.value) })}
            />
            <Input
              rotulo="Temperatura máx."
              type="number"
              sufixo="°C"
              value={form.temperaturaMax}
              onChange={(e) => setForm({ ...form, temperaturaMax: Number(e.target.value) })}
            />
            <Input
              rotulo="Pressão mín."
              type="number"
              step={0.5}
              sufixo="bar"
              value={form.pressaoMin}
              onChange={(e) => setForm({ ...form, pressaoMin: Number(e.target.value) })}
            />
            <Input
              rotulo="Pressão máx."
              type="number"
              step={0.5}
              sufixo="bar"
              value={form.pressaoMax}
              onChange={(e) => setForm({ ...form, pressaoMax: Number(e.target.value) })}
            />
          </div>
          <Input
            rotulo="Confiança mínima da IA (0 a 1)"
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={form.confiancaMinimaIA}
            onChange={(e) => setForm({ ...form, confiancaMinimaIA: Number(e.target.value) })}
          />
          {erro && (
            <p role="alert" className="text-xs text-red-300">
              {erro}
            </p>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button variante="fantasma" tamanho="sm" onClick={() => setForm({ ...REGRAS_PADRAO })}>
              Restaurar padrão
            </Button>
            <div className="flex gap-2">
              <Button variante="secundario" tamanho="sm" onClick={onFechar}>
                Cancelar
              </Button>
              <Button type="submit" variante="primario" tamanho="sm">
                Salvar limites
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

