/**
 * Event bus síncrono e tipado. Emite PipelineStep e LogEvent.
 *
 * Dono: Membro 2 (Controlador). A store Zustand se inscreve aqui.
 */
import type { BusEvent, BusHandler, EventBus } from "./contracts";
import type { LogEvent, ModuloSistema, NivelLog } from "./types";
import { gerarId } from "./utils";

export function criarEventBus(): EventBus {
  const handlers = new Set<BusHandler>();
  return {
    emit(evento: BusEvent) {
      for (const handler of [...handlers]) {
        try {
          handler(evento);
        } catch {
          // Um assinante com erro não pode derrubar o pipeline.
        }
      }
    },
    on(handler: BusHandler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

/** Instância compartilhada da aplicação. */
export const eventBus: EventBus = criarEventBus();

/** Monta um LogEvent completo. */
export function criarLog(
  nivel: NivelLog,
  modulo: ModuloSistema,
  mensagem: string,
  extra: { traceId?: string; payload?: unknown } = {},
): LogEvent {
  return {
    id: gerarId("log"),
    timestamp: new Date().toISOString(),
    nivel,
    modulo,
    mensagem,
    ...(extra.traceId !== undefined ? { traceId: extra.traceId } : {}),
    ...(extra.payload !== undefined ? { payload: extra.payload } : {}),
  };
}

/** Atalho: cria e emite um log no bus informado. */
export function emitirLog(
  bus: EventBus,
  nivel: NivelLog,
  modulo: ModuloSistema,
  mensagem: string,
  extra: { traceId?: string; payload?: unknown } = {},
): LogEvent {
  const log = criarLog(nivel, modulo, mensagem, extra);
  bus.emit({ tipo: "log", log });
  return log;
}

