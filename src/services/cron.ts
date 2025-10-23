import cron from "node-cron";
import { SupabaseService } from "./supabase";
import { TelegramService } from "./telegram";
import { PrinterService } from "./printer";
import dayjs from "../utils/dates";
import { getNextGames, type GameEntrySupabase } from "../next-games";

export class CronService {
  private EVERY_MINUTE = "* * * * *" as const;
  private EVERY_DAY = "0 3 * * *" as const;

  private FINISHED_STATUS = "Finalizado" as const;
  private IN_PROGRESS_STATUS = "En juego" as const;

  private supabase: SupabaseService;
  private telegram: TelegramService;
  private printer: PrinterService;

  private todayGames: GameEntrySupabase[];

  constructor() {
    this.supabase = new SupabaseService();
    this.telegram = new TelegramService();
    this.printer = PrinterService.getInstance();
    this.todayGames = [];
  }

  private async getWeekGames() {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.printer.fetchError(errorMessage);
      await this.telegram.sendError(errorMessage, "getWeekGames");
      return [];
    }
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
    this.printer.trackerStart(game.home_team.fullName, game.away_team.fullName);

    const startTime = dayjs(game.date);

    const job = cron.schedule(this.EVERY_MINUTE, async () => {
      try {
        const now = dayjs();

        this.printer.debug("Checking game status...");

        if (now.isBefore(startTime)) {
          const minutesLeft = startTime.diff(now, "minutes");
          this.printer.countdown(game.home_team.fullName, game.away_team.fullName, minutesLeft);
          return;
        }

        const todayGames = await getNextGames(now);
        const liveGame = todayGames.find((g) => g.code === game.code);

        if (!liveGame) {
          this.printer.gameNotFound(game.home_team.fullName, game.away_team.fullName);
          return;
        }

        const currentGame = await this.supabase.getGameByCode(liveGame.code);

        const { statusUpdate, homeTeamScored, awayTeamScored } =
          this.getGameUpdates(currentGame, liveGame);

        this.printer.gameHeader(
          liveGame.home_team.fullName,
          liveGame.away_team.fullName,
          Number(liveGame.score.homeTeam.totalScore),
          Number(liveGame.score.awayTeam.totalScore)
        );

        if (statusUpdate) {
          this.printer.statusChanged(liveGame.status);
        } else {
          this.printer.statusCurrent(liveGame.status);
        }

        if (homeTeamScored) {
          this.printer.goal(liveGame.home_team.fullName, Number(liveGame.score.homeTeam.totalScore));
        }

        if (awayTeamScored) {
          this.printer.goal(liveGame.away_team.fullName, Number(liveGame.score.awayTeam.totalScore));
        }

        if (!homeTeamScored && !awayTeamScored) {
          this.printer.noGoals();
        }

        this.printer.gameDivider();

        await this.supabase.updateGame(liveGame);

        if (liveGame.status === this.FINISHED_STATUS) {
          this.printer.gameFinished(
            Number(liveGame.score.homeTeam.totalScore),
            Number(liveGame.score.awayTeam.totalScore)
          );
          job.stop();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.printer.trackerError(errorMessage);
        await this.telegram.sendError(
          errorMessage,
          `Real-time tracker - ${game.home_team.fullName} vs ${game.away_team.fullName}`
        );
      }
    });

    job.start();

    return job;
  }

  private printGameInfo(game: GameEntrySupabase) {
    this.printer.gameInfo(game);
  }

  async start() {
    this.printer.serviceStart();

    await this.startWeekGamesJob();

    if (this.todayGames.length === 0) {
      this.printer.noGamesToday();
    } else {
      this.printer.todaysGamesHeader(this.todayGames.length);

      for (const game of this.todayGames) {
        this.printGameInfo(game);

        if (game.status === this.IN_PROGRESS_STATUS) {
          this.handleRealTimeGameJob(game);
        }
      }
      this.printer.newLine();
    }
  }
}
