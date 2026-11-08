/**
 * Instâncias compartilhadas: repositório local e gateway de análise.
 *
 * Dono: Membro 2. A UI nunca usa estas instâncias diretamente — sempre via
 * hooks de fachada (`src/hooks`).
 */
import { eventBus } from "../core/eventBus";
import { criarGatewayMock } from "../core/mockEngine";
import { criarRepositorioLocal } from "../core/repository";

export const repositorio = criarRepositorioLocal();

export const gateway = criarGatewayMock(repositorio, eventBus);

