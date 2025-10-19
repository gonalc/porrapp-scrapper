import chalk from "chalk";

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;
  private isTestEnvironment: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    this.chatId = process.env.TELEGRAM_CHAT_ID || "";
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    // Detect test environment - check for Bun test globals or NODE_ENV
    this.isTestEnvironment = process.env.NODE_ENV === "test" || 
                             (typeof Bun !== "undefined" && (Bun as any).jest !== undefined);

    if (!this.botToken || !this.chatId) {
      if (!this.isTestEnvironment) {
        console.log(
          chalk.yellow(
            "⚠️  Telegram credentials not found in .env - notifications disabled"
          )
        );
      }
    }
  }

  async sendStartup(): Promise<void> {
    const message = [
      "🚀 <b>Porrapp Scrapper Started</b>",
      "",
      `⏰ <i>${this.formatTimestamp()}</i>`,
      "✅ Cron service initialized",
      "📊 Real-time tracking active",
    ].join("\n");

    await this.sendMessage(message);
  }

  async sendShutdown(): Promise<void> {
    const message = [
      "🛑 <b>Porrapp Scrapper Stopped</b>",
      "",
      `⏰ <i>${this.formatTimestamp()}</i>`,
      "👋 Service gracefully terminated",
    ].join("\n");

    await this.sendMessage(message);
  }

  async sendError(error: string, context?: string): Promise<void> {
    const message = [
      "❌ <b>Critical Error</b>",
      "",
      `⏰ <i>${this.formatTimestamp()}</i>`,
      context ? `📍 Context: ${context}` : "",
      "",
      `<code>${this.escapeHtml(error)}</code>`,
    ]
      .filter(Boolean)
      .join("\n");

    await this.sendMessage(message);
  }

  private async sendMessage(text: string): Promise<void> {
    // Skip if in test environment
    if (this.isTestEnvironment) {
      return;
    }

    // Skip if credentials are missing
    if (!this.botToken || !this.chatId) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(
          chalk.red(`Failed to send Telegram message: ${error}`)
        );
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Telegram notification failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }

  private formatTimestamp(): string {
    return new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "full",
      timeStyle: "medium",
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
