import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Team } from "../get-teams";
import type { GameEntrySupabase } from "../next-games";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class SupabaseService {
  supabase: SupabaseClient;

  TEAMS_TABLE = "teams";
  GAMES_TABLE = "games";

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log("SupabaseService initialized");
  }

  async insertTeams(teams: Team[]) {
    const { data, error } = await this.supabase
      .from(this.TEAMS_TABLE)
      .insert(teams)
      .select();

    console.log({ data, error });
  }

  async insertGames(games: GameEntrySupabase[]) {
    const { data, error } = await this.supabase
      .from(this.GAMES_TABLE)
      .upsert(games, {
        onConflict: "code",
      })
      .select();

    console.log({ data, error });
  }
}
