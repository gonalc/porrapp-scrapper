import cron from "node-cron";
import chalk from "chalk";
import { SupabaseService } from "./supabase";
import { TelegramService } from "./telegram";
import dayjs from "../utils/dates";
import { getNextGames, type GameEntrySupabase } from "../next-games";

export class CronService {
  private EVERY_MINUTE = "* * * * *" as const;
  private EVERY_DAY = "0 3 * * *" as const;

  private FINISHED_STATUS = "Finalizado" as const;
  private PENDING_STATUS = "Pendiente" as const;
  private IN_PROGRESS_STATUS = "En juego" as const;

  private supabase: SupabaseService;
  private telegram: TelegramService;

  private todayGames: GameEntrySupabase[];

  constructor() {
    this.supabase = new SupabaseService();
    this.telegram = new TelegramService();
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
      console.error(chalk.red(`❌ Failed to fetch week games: ${errorMessage}`));
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
    console.log("");
    console.log(chalk.cyan("═".repeat(80)));
    console.log("");
    console.log(
      chalk.bold.blue("🎮 Real-Time Tracker Started") +
      chalk.gray(" │ ") +
      chalk.white(`${game.home_team.fullName} vs ${game.away_team.fullName}`)
    );
    console.log(chalk.gray(`   Started at: ${dayjs().format("HH:mm:ss")}`));
    console.log("");

    const startTime = dayjs(game.date);

    const job = cron.schedule(this.EVERY_MINUTE, async () => {
      try {
        const now = dayjs();
        const timestamp = chalk.gray(`[${now.format("HH:mm:ss")}]`);

        console.log(timestamp + " " + chalk.dim("Checking game status..."));

        if (now.isBefore(startTime)) {
          const minutesLeft = startTime.diff(now, "minutes");
          console.log(
            timestamp + " " +
            chalk.yellow("⏱️  Countdown") +
            chalk.gray(" │ ") +
            chalk.white(`${game.home_team.fullName} vs ${game.away_team.fullName}`) +
            chalk.gray(" │ ") +
            chalk.yellow(`Starts in ${minutesLeft} min`)
          );
          console.log("");
          return;
        }

        const todayGames = await getNextGames(now);
        const liveGame = todayGames.find((g) => g.code === game.code);

        if (!liveGame) {
          console.log(
            timestamp + " " +
            chalk.red("❌ Game Not Found") +
            chalk.gray(" │ ") +
            chalk.white(`${game.home_team.fullName} vs ${game.away_team.fullName}`)
          );
          console.log("");
          return;
        }

        const currentGame = await this.supabase.getGameByCode(liveGame.code);

        const { statusUpdate, homeTeamScored, awayTeamScored } =
          this.getGameUpdates(currentGame, liveGame);

        // Display game header
        console.log(
          timestamp + " " +
          chalk.bold.white(`${liveGame.home_team.fullName}`) +
          chalk.gray(" vs ") +
          chalk.bold.white(`${liveGame.away_team.fullName}`) +
          chalk.gray(" │ ") +
          chalk.cyan(`${liveGame.score.homeTeam.totalScore}-${liveGame.score.awayTeam.totalScore}`)
        );

        // Status update
        if (statusUpdate) {
          const statusEmoji = liveGame.status === this.FINISHED_STATUS ? "🏁" :
                             liveGame.status === this.IN_PROGRESS_STATUS ? "▶️" : "📋";
          console.log(
            "   " + statusEmoji + " " +
            chalk.bold.magenta("Status Changed") +
            chalk.gray(" → ") +
            chalk.white(liveGame.status)
          );
        } else {
          console.log(
            "   " + chalk.dim("📊 Status: ") + chalk.gray(liveGame.status)
          );
        }

        // Goal updates
        if (homeTeamScored) {
          console.log(
            "   " + chalk.bold.green("⚽ GOAL!") +
            chalk.gray(" │ ") +
            chalk.white(liveGame.home_team.fullName) +
            chalk.gray(" scored! ") +
            chalk.green(`(${liveGame.score.homeTeam.totalScore})`)
          );
        }

        if (awayTeamScored) {
          console.log(
            "   " + chalk.bold.green("⚽ GOAL!") +
            chalk.gray(" │ ") +
            chalk.white(liveGame.away_team.fullName) +
            chalk.gray(" scored! ") +
            chalk.green(`(${liveGame.score.awayTeam.totalScore})`)
          );
        }

        if (!homeTeamScored && !awayTeamScored) {
          console.log("   " + chalk.dim("💤 No goals scored"));
        }

        console.log(chalk.gray("   " + "─".repeat(76)));
        console.log("");

        await this.supabase.updateGame(liveGame);

        if (liveGame.status === this.FINISHED_STATUS) {
          console.log(
            chalk.bold.green("🏁 GAME FINISHED") +
            chalk.gray(" │ ") +
            chalk.white(`Final Score: ${liveGame.score.homeTeam.totalScore}-${liveGame.score.awayTeam.totalScore}`)
          );
          console.log(chalk.cyan("═".repeat(80)));
          console.log("");
          job.stop();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`❌ Real-time tracker error: ${errorMessage}`));
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
    const statusIcon =
      game.status === this.PENDING_STATUS ? "📅" :
      game.status === this.IN_PROGRESS_STATUS ? "🟢" :
      game.status === this.FINISHED_STATUS ? "✅" : "📋";

    if (game.status === this.PENDING_STATUS) {
      console.log(
        "   " + statusIcon + " " +
        chalk.yellow(game.status.padEnd(12)) +
        chalk.gray("│") + " " +
        chalk.white(`${game.home_team.fullName}`) +
        chalk.dim(" vs ") +
        chalk.white(`${game.away_team.fullName}`) +
        chalk.gray(" │ ") +
        chalk.cyan(dayjs(game.date).format("DD/MM HH:mm"))
      );
    } else {
      const homeScore = game.score.homeTeam.totalScore;
      const awayScore = game.score.awayTeam.totalScore;
      const scoreColor = game.status === this.FINISHED_STATUS ? chalk.bold.green : chalk.bold.cyan;

      console.log(
        "   " + statusIcon + " " +
        chalk.cyan(game.status.padEnd(12)) +
        chalk.gray("│") + " " +
        chalk.white(game.home_team.fullName.padEnd(20)) +
        scoreColor(` ${homeScore} - ${awayScore} `) +
        chalk.white(game.away_team.fullName)
      );
    }
  }

  async start() {
    console.log("");
    console.log(chalk.bold.green("═".repeat(80)));
    console.log("");
    console.log(
      chalk.bold.green("  ⚽ LaLiga Match Tracker") +
      chalk.gray(" │ ") +
      chalk.white("Service Started")
    );
    console.log(chalk.gray(`  ${dayjs().format("dddd, MMMM D, YYYY - HH:mm:ss")}`));
    console.log("");
    console.log(chalk.bold.green("═".repeat(80)));
    console.log("");

    const mainJob = await this.startWeekGamesJob();

    if (this.todayGames.length === 0) {
      console.log(chalk.yellow("   ℹ️  No games scheduled for today"));
      console.log("");
    } else {
      console.log(chalk.bold.white(`📋 Today's Games (${this.todayGames.length})`));
      console.log("");

      for (const game of this.todayGames) {
        this.printGameInfo(game);

        if (game.status === this.IN_PROGRESS_STATUS) {
          this.handleRealTimeGameJob(game);
        }
      }
      console.log("");
    }

    await mainJob.stop();
  }
}
