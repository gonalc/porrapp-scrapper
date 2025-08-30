import dayjs, { UNIDAD_EDITORIAL_FORMAT } from "./utils/dates";
import { getNextGames } from "./next-games";
import { SupabaseService } from "./services/supabase";
import { CronService } from "./services/cron";

const cronService = new CronService();

cronService.start();
