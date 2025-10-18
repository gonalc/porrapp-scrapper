import cron from "node-cron";
import { SupabaseService } from "./supabase";
import dayjs from "../utils/dates";
import { getNextGames, type GameEntrySupabase } from "../next-games";

export class CronService {
  private EVERY_MINUTE = "* * * * *";
  private EVERY_DAY = "0 3 * * *";

  private FINISHED_STATUS = "Finalizado";

  private supabase: SupabaseService;

  private todayGames: GameEntrySupabase[];

  constructor() {
    this.supabase = new SupabaseService();
    this.todayGames = [];
  }

  private async getWeekGames() {
    const today = dayjs();
    const topDate = today.add(8, "days");

    let date = today.subtract(1, "day");

    const todayGames: GameEntrySupabase[] = [];

    while (date.isSameOrBefore(topDate)) {
      const nextGames = await getNextGames(date);

      if (today.isSame(date, "day")) {
        todayGames.push(...nextGames);
      }

      await this.supabase.insertGames(nextGames);

      date = date.add(1, "day");
    }

    return todayGames;
  }

  private async startWeekGamesJob() {
    const job = cron.schedule(this.EVERY_DAY, async () => {
      await this.getWeekGames();
    });

    job.start();

    const todayGames = await this.getWeekGames();

    this.todayGames = todayGames;

    return job;
  }

  private getGameUpdates(
    currentGame: GameEntrySupabase,
    liveGame: GameEntrySupabase,
  ) {
    const statusUpdate = liveGame.status !== currentGame.status;

    const currentHomeScore = currentGame.score.homeTeam.totalScore;
    const currentAwayScore = currentGame.score.awayTeam.totalScore;
    const liveHomeScore = liveGame.score.homeTeam.totalScore;
    const liveAwayScore = liveGame.score.awayTeam.totalScore;

    const homeTeamScored = currentHomeScore !== liveHomeScore;
    const awayTeamScored = currentAwayScore !== liveAwayScore;

    return { statusUpdate, homeTeamScored, awayTeamScored };
  }

  private handleRealTimeGameJob(game: GameEntrySupabase) {
    const startTime = dayjs(game.date);

    const job = cron.schedule(this.EVERY_MINUTE, async () => {
      const now = dayjs();

      if (now.isBefore(startTime)) {
        console.log(
          `Game ${game.home_team.fullName} - ${game.away_team.fullName} starts in ${startTime.diff(now, "minutes")} minutes`,
        );
        return;
      }

      const todayGames = await getNextGames(now);
      const liveGame = todayGames.find((g) => g.code === game.code);

      if (!liveGame) {
        console.log(
          `Can't find game ${game.home_team.fullName} - ${game.away_team.fullName}`,
        );
        return;
      }

      const currentGame = await this.supabase.getGameByCode(liveGame.code);

      const { statusUpdate, homeTeamScored, awayTeamScored } =
        this.getGameUpdates(currentGame, liveGame);

      if (statusUpdate) {
        console.log("game status updated: ", liveGame.status);
      }

      if (homeTeamScored) {
        console.log("home team scored");
      }

      if (awayTeamScored) {
        console.log("away team scored");
      }

      await this.supabase.updateGame(liveGame);

      if (liveGame.status === this.FINISHED_STATUS) {
        job.stop();
      }
    });

    job.start();

    return job;
  }

  async start() {
    console.log("Starting cron service");

    const mainJob = await this.startWeekGamesJob();

    for (const game of this.todayGames) {
      console.log(
        `Game ${game.code} starts at ${dayjs(game.date).format("DD/MM/YYYY HH:mm")}`,
      );

      this.handleRealTimeGameJob(game);
    }

    await mainJob.stop();
  }
}
