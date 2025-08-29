import { UnidadEditorialService, type Score } from "./services/unidad-editorial";

export type GameEntrySupabase = {
  code: string;
  date: Date;
  tournament_name: string;
  location: string;
  home_team: object;
  away_team: object;
  match_day: string;
  season: string;
  status: string;
  score: Score;
}

export async function getNextGames() {
  const nextGames = await UnidadEditorialService.getGames();

  const games: GameEntrySupabase[] = nextGames.map(game => {
    return {
      code: game.id,
      date: new Date(game.startDate),
      tournament_name: game.tournament.name,
      location: game.sportEvent.location.name,
      home_team: game.sportEvent.competitors.homeTeam,
      away_team: game.sportEvent.competitors.awayTeam,
      match_day: game.sportEvent.matchDay,
      season: game.sportEvent.season.name,
      status: game.sportEvent.status.name,
      score: game.score
    }
  })

  return games;
}
