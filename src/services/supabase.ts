import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Team } from "../get-teams";
import type { GameEntrySupabase } from "../next-games";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class SupabaseService {
  private supabase: SupabaseClient;

  private TEAMS_TABLE = "teams";
  private GAMES_TABLE = "games";

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log("SupabaseService initialized");
  }

  async insertTeams(teams: Team[]) {
    const { error } = await this.supabase
      .from(this.TEAMS_TABLE)
      .insert(teams)
      .select();

    console.log({ error });
  }

  async insertGames(games: GameEntrySupabase[]) {
    const { error } = await this.supabase
      .from(this.GAMES_TABLE)
      .upsert(games, {
        onConflict: "code",
      })
      .select();

    console.log({ error });
  }

  async getGameByCode(code: string) {
    const { data, error } = await this.supabase
      .from(this.GAMES_TABLE)
      .select()
      .eq("code", code)
      .single();

    if (error) {
      console.log({ error });
    }

    return data;
  }

  async updateGame(game: GameEntrySupabase) {
    const { data, error } = await this.supabase
      .from(this.GAMES_TABLE)
      .update(game)
      .eq("code", game.code)
      .select()
      .single();

    if (error) {
      console.log({ error });
    }

    return data;
  }
}
