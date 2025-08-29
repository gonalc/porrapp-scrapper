import { getNextGames } from "./next-games";

const nextGames = await getNextGames();

console.log('NEXT GAMES: ', nextGames)
