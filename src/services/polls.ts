import type { GameEntrySupabase } from "../next-games";
import { SupabaseClient } from "./supabase-client";

export type Poll = {
  id: string;
  game_code: string;
  author: string;
  code: string;
  modality: 'private' | 'public';
  created_at: Date;
  updated_at: Date;
}

export type Guess = {
  id: string;
  author: string;
  poll_id: string;
  game_code: string;
  home_team_score: number;
  away_team_score: number;
  created_at: Date;
}

export type PublicGuessesPoll = Pick<Poll, 'id'> & {
  guesses: Pick<Guess, 'id' | 'author' | 'home_team_score' | 'away_team_score'>[];
  games: Pick<GameEntrySupabase, 'status' | 'score'> & {
    id: string;
  };
};

export class PollsService extends SupabaseClient {
  private TABLE_NAME = "polls";

  constructor() {
    super();
  }

  async getPublicPoll(gameCode: string) {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select(
        `
        id,
        guesses(
          id,
          author,
          home_team_score,
          away_team_score
        ),
        games(
          id,
          status,
          score
        )`,
      )
      .eq("game_code", gameCode)
      .eq("modality", "public")
      .single();

    if (error) {
      console.error("Error getting the public poll: ", error);
      throw error;
    }
    return data as unknown as PublicGuessesPoll;
  }
}
