import { getNextGames } from "./next-games";
import { SupabaseService } from "./services/supabase";

const nextGames = await getNextGames();

const supabase = new SupabaseService();

await supabase.insertGames(nextGames);
