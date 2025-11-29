import { UserStatsService } from "./services/user-stats";

const gameCode = "01_0101_20251129_855_174"

const statsService = new UserStatsService();

await statsService.handleFinishedGame(gameCode);
