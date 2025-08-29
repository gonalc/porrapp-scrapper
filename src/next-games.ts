import { UnidadEditorialService } from "./services/unidad-editorial";

export async function getNextGames() {
  const nextGames = await UnidadEditorialService.getGames();

  return nextGames;
}
