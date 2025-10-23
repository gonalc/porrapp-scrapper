import chalk from "chalk";
import dayjs from "../utils/dates";
import type { GameEntrySupabase } from "../next-games";

export class PrinterService {
  private static instance: PrinterService;

  private FINISHED_STATUS = "Finalizado" as const;
  private PENDING_STATUS = "Pendiente" as const;
  private IN_PROGRESS_STATUS = "En juego" as const;

  private constructor() {}

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  private timestamp(): string {
    return chalk.gray(`[${dayjs().format("HH:mm:ss")}]`);
  }

  separator(char: "=" | "-" = "=", length: number = 80): void {
    console.log(chalk.cyan(char.repeat(length)));
  }

  newLine(): void {
    console.log("");
  }

  success(message: string): void {
    console.log(chalk.green(message));
  }

  error(message: string): void {
    console.error(chalk.red(message));
  }

  info(message: string): void {
    console.log(chalk.white(message));
  }

  warning(message: string): void {
    console.log(chalk.yellow(message));
  }

  debug(message: string): void {
    console.log(this.timestamp() + " " + chalk.dim(message));
  }

  serviceStart(): void {
    this.newLine();
    console.log(chalk.bold.green("═".repeat(80)));
    this.newLine();
    console.log(
      chalk.bold.green("  ⚽ LaLiga Match Tracker") +
      chalk.gray(" │ ") +
      chalk.white("Service Started")
    );
    console.log(chalk.gray(`  ${dayjs().format("dddd, MMMM D, YYYY - HH:mm:ss")}`));
    this.newLine();
    console.log(chalk.bold.green("═".repeat(80)));
    this.newLine();
  }

  trackerStart(homeTeam: string, awayTeam: string): void {
    this.newLine();
    console.log(chalk.cyan("═".repeat(80)));
    this.newLine();
    console.log(
      chalk.bold.blue("🎮 Real-Time Tracker Started") +
      chalk.gray(" │ ") +
      chalk.white(`${homeTeam} vs ${awayTeam}`)
    );
    console.log(chalk.gray(`   Started at: ${dayjs().format("HH:mm:ss")}`));
    this.newLine();
  }

  countdown(homeTeam: string, awayTeam: string, minutesLeft: number): void {
    console.log(
      this.timestamp() + " " +
      chalk.yellow("⏱️  Countdown") +
      chalk.gray(" │ ") +
      chalk.white(`${homeTeam} vs ${awayTeam}`) +
      chalk.gray(" │ ") +
      chalk.yellow(`Starts in ${minutesLeft} min`)
    );
    this.newLine();
  }

  gameNotFound(homeTeam: string, awayTeam: string): void {
    console.log(
      this.timestamp() + " " +
      chalk.red("❌ Game Not Found") +
      chalk.gray(" │ ") +
      chalk.white(`${homeTeam} vs ${awayTeam}`)
    );
    this.newLine();
  }

  gameHeader(homeTeam: string, awayTeam: string, homeScore: number, awayScore: number): void {
    console.log(
      this.timestamp() + " " +
      chalk.bold.white(homeTeam) +
      chalk.gray(" vs ") +
      chalk.bold.white(awayTeam) +
      chalk.gray(" │ ") +
      chalk.cyan(`${homeScore}-${awayScore}`)
    );
  }

  statusChanged(status: string): void {
    const statusEmoji = 
      status === this.FINISHED_STATUS ? "🏁" :
      status === this.IN_PROGRESS_STATUS ? "▶️" : "📋";
    
    console.log(
      "   " + statusEmoji + " " +
      chalk.bold.magenta("Status Changed") +
      chalk.gray(" → ") +
      chalk.white(status)
    );
  }

  statusCurrent(status: string): void {
    console.log(
      "   " + chalk.dim("📊 Status: ") + chalk.gray(status)
    );
  }

  goal(teamName: string, score: number): void {
    console.log(
      "   " + chalk.bold.green("⚽ GOAL!") +
      chalk.gray(" │ ") +
      chalk.white(teamName) +
      chalk.gray(" scored! ") +
      chalk.green(`(${score})`)
    );
  }

  noGoals(): void {
    console.log("   " + chalk.dim("💤 No goals scored"));
  }

  gameFinished(homeScore: number, awayScore: number): void {
    console.log(
      chalk.bold.green("🏁 GAME FINISHED") +
      chalk.gray(" │ ") +
      chalk.white(`Final Score: ${homeScore}-${awayScore}`)
    );
    console.log(chalk.cyan("═".repeat(80)));
    this.newLine();
  }

  gameDivider(): void {
    console.log(chalk.gray("   " + "─".repeat(76)));
    this.newLine();
  }

  noGamesToday(): void {
    console.log(chalk.yellow("   ℹ️  No games scheduled for today"));
    this.newLine();
  }

  todaysGamesHeader(count: number): void {
    console.log(chalk.bold.white(`📋 Today's Games (${count})`));
    this.newLine();
  }

  gameInfo(game: GameEntrySupabase): void {
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

  fetchError(errorMessage: string): void {
    console.error(chalk.red(`❌ Failed to fetch week games: ${errorMessage}`));
  }

  trackerError(errorMessage: string): void {
    console.error(chalk.red(`❌ Real-time tracker error: ${errorMessage}`));
  }
}
