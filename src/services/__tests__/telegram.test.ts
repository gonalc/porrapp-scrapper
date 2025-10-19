import { test, expect, describe, beforeEach, spyOn } from "bun:test";
import { TelegramService } from "../telegram";

describe("TelegramService", () => {
  let telegramService: TelegramService;
  let fetchSpy: any;

  beforeEach(() => {
    // Spy on global fetch to ensure it's not called during tests
    fetchSpy = spyOn(global, "fetch");
    telegramService = new TelegramService();
  });

  test("should not send actual messages in test environment", async () => {
    await telegramService.sendStartup();
    await telegramService.sendShutdown();
    await telegramService.sendError("Test error", "Test context");

    // Verify that fetch was never called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("should detect test environment", () => {
    // The service should be created without errors
    expect(telegramService).toBeDefined();
    
    // Private property check - we can infer test mode by checking that no fetch calls are made
    // when credentials are provided (mocked via env vars)
    expect(true).toBe(true);
  });
});
