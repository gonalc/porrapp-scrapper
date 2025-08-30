import dayjs, { UNIDAD_EDITORIAL_FORMAT } from "./utils/dates";
import { getNextGames } from "./next-games";
import { SupabaseService } from "./services/supabase";

const today = dayjs();
const topDate = today.add(8, 'days');

let date = today;

const supabase = new SupabaseService();

while (date.isSameOrBefore(topDate)) {
  console.log(`Processing date: ${date.format(UNIDAD_EDITORIAL_FORMAT)}`);
  const nextGames = await getNextGames(date);

  await supabase.insertGames(nextGames);

  date = date.add(1, 'day');
}
