import { CronService } from "./services/cron";
import { TelegramService } from "./services/telegram";

const cronService = new CronService();
const telegramService = new TelegramService();

const handleShutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  await telegramService.sendShutdown();
  process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

cronService.start();

telegramService.sendStartup();
