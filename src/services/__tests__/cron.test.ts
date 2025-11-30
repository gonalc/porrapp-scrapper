import { test, expect, describe, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { CronService } from "../cron";
import type { GameEntrySupabase } from "../../next-games";

const mockJob = {
  start: mock(() => {}),
  stop: mock(() => {})
};

const mockCron = {
  schedule: mock((_pattern, _callback) => mockJob)
};

mock.module("node-cron", () => ({
  default: mockCron
}));

// Mock PrinterService
const mockPrinterMethods = {
  serviceStart: mock(() => {}),
  fetchError: mock((_error: string) => {}),
  trackerStart: mock((_home: string, _away: string) => {}),
  debug: mock((_message: string) => {}),
  countdown: mock((_home: string, _away: string, _minutes: number) => {}),
  gameNotFound: mock((_home: string, _away: string) => {}),
  gameHeader: mock((_home: string, _away: string, _homeScore: number, _awayScore: number) => {}),
  statusChanged: mock((_status: string) => {}),
  statusCurrent: mock((_status: string) => {}),
  goal: mock((_team: string, _score: number) => {}),
  noGoals: mock(() => {}),
  gameDivider: mock(() => {}),
  gameFinished: mock((_homeScore: number, _awayScore: number) => {}),
  trackerError: mock((_error: string) => {}),
  noGamesToday: mock(() => {}),
  todaysGamesHeader: mock((_count: number) => {}),
  gameInfo: mock((_game: GameEntrySupabase) => {}),
  newLine: mock(() => {})
};

class MockPrinterService {
  static instance: MockPrinterService;

  static getInstance() {
    if (!MockPrinterService.instance) {
      MockPrinterService.instance = new MockPrinterService();
    }
    return MockPrinterService.instance;
  }

  serviceStart = mockPrinterMethods.serviceStart;
  fetchError = mockPrinterMethods.fetchError;
  trackerStart = mockPrinterMethods.trackerStart;
  debug = mockPrinterMethods.debug;
  countdown = mockPrinterMethods.countdown;
  gameNotFound = mockPrinterMethods.gameNotFound;
  gameHeader = mockPrinterMethods.gameHeader;
  statusChanged = mockPrinterMethods.statusChanged;
  statusCurrent = mockPrinterMethods.statusCurrent;
  goal = mockPrinterMethods.goal;
  noGoals = mockPrinterMethods.noGoals;
  gameDivider = mockPrinterMethods.gameDivider;
  gameFinished = mockPrinterMethods.gameFinished;
  trackerError = mockPrinterMethods.trackerError;
  noGamesToday = mockPrinterMethods.noGamesToday;
  todaysGamesHeader = mockPrinterMethods.todaysGamesHeader;
  gameInfo = mockPrinterMethods.gameInfo;
  newLine = mockPrinterMethods.newLine;
}

mock.module("../printer", () => ({
  PrinterService: MockPrinterService
}));

// Create shared mock functions that we can track
const mockSupabaseMethods = {
  insertGames: mock(async (_games: GameEntrySupabase[]) => {}),
  getGameByCode: mock(async (_code: string): Promise<GameEntrySupabase> => {
    throw new Error("Mock not configured");
  }),
  updateGame: mock(async (_game: GameEntrySupabase) => {})
};

class MockSupabaseService {
  insertGames = mockSupabaseMethods.insertGames;
  getGameByCode = mockSupabaseMethods.getGameByCode;
  updateGame = mockSupabaseMethods.updateGame;
}

mock.module("../supabase", () => ({
  SupabaseService: MockSupabaseService
}));

// Mock TelegramService
const mockTelegramMethods = {
  sendStartup: mock(async () => {}),
  sendShutdown: mock(async () => {}),
  sendError: mock(async (_error: string, _context?: string) => {})
};

class MockTelegramService {
  sendStartup = mockTelegramMethods.sendStartup;
  sendShutdown = mockTelegramMethods.sendShutdown;
  sendError = mockTelegramMethods.sendError;
}

mock.module("../telegram", () => ({
  TelegramService: MockTelegramService
}));

// Mock UserStatsService
const mockUserStatsServiceMethods = {
  handleFinishedGame: mock(async (_gameCode: string) => {})
};

class MockUserStatsService {
  handleFinishedGame = mockUserStatsServiceMethods.handleFinishedGame;
}

mock.module("../user-stats", () => ({
  UserStatsService: MockUserStatsService
}));

const createMockDayjs = () => ({
  add: mock().mockReturnThis(),
  subtract: mock().mockReturnThis(),
  isSameOrBefore: mock().mockReturnValue(true),
  isSame: mock().mockReturnValue(false),
  isBefore: mock().mockReturnValue(false),
  diff: mock().mockReturnValue(30),
  format: mock().mockReturnValue("15/01/2024 16:00"),
  toDate: mock().mockReturnValue(new Date("2024-01-15T15:00:00Z"))
});

const mockDayjs = mock().mockImplementation((_date?: any) => createMockDayjs());

mock.module("../utils/dates", () => ({
  default: mockDayjs
}));

const mockGetNextGames = mock(async (_date: any): Promise<GameEntrySupabase[]> => []);
mock.module("../../next-games", () => ({
  getNextGames: mockGetNextGames
}));

describe("CronService", () => {
  let cronService: CronService;

  const createMockGame = (overrides: Partial<GameEntrySupabase> = {}): GameEntrySupabase => ({
    code: "game-123",
    date: new Date("2024-01-15T15:00:00Z"),
    datetime: new Date("2024-01-15T16:00:00Z"),
    tournament_name: "LaLiga",
    location: "Santiago Bernabéu",
    home_team: { fullName: "Real Madrid" },
    away_team: { fullName: "Barcelona" },
    match_day: "20",
    season: "2023-24",
    status: "Programado",
    score: {
      homeTeam: { totalScore: "0", subScore: "0" },
      awayTeam: { totalScore: "0", subScore: "0" },
      winner: { id: "", name: "" },
      period: {
        id: 1,
        name: "Primera Parte",
        alternateNames: { esES: "Primera Parte", enEN: "First Half" }
      }
    },
    ...overrides
  });

  beforeEach(() => {
    // Clear call history but preserve mock behavior
    mockJob.start.mockClear();
    mockJob.stop.mockClear();
    mockCron.schedule.mockClear();

    // Re-setup the mock implementation after clearing
    mockCron.schedule.mockReturnValue(mockJob);

    mockGetNextGames.mockClear();
    mockGetNextGames.mockResolvedValue([]);

    // Clear printer mock methods
    Object.values(mockPrinterMethods).forEach(mockMethod => mockMethod.mockClear());

    mockDayjs.mockClear();
    mockDayjs.mockImplementation((_date?: any) => createMockDayjs());

    // Clear the shared mock methods and reset their implementations
    mockSupabaseMethods.insertGames.mockClear();
    mockSupabaseMethods.insertGames.mockResolvedValue(undefined);

    mockSupabaseMethods.getGameByCode.mockClear();
    mockSupabaseMethods.getGameByCode.mockRejectedValue(new Error("Mock not configured"));

    mockSupabaseMethods.updateGame.mockClear();
    mockSupabaseMethods.updateGame.mockResolvedValue(undefined);

    // Clear telegram mock methods
    mockTelegramMethods.sendStartup.mockClear();
    mockTelegramMethods.sendShutdown.mockClear();
    mockTelegramMethods.sendError.mockClear();

    // Clear user stats mock methods
    mockUserStatsServiceMethods.handleFinishedGame.mockClear();
    mockUserStatsServiceMethods.handleFinishedGame.mockResolvedValue(undefined);

    cronService = new CronService();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe("constructor", () => {
    test("should set correct constants", () => {
      const service = new CronService();

      expect(service['EVERY_MINUTE']).toBe("* * * * *");
      expect(service['EVERY_DAY']).toBe("0 3 * * *");
      expect(service['FINISHED_STATUS']).toBe("Finalizado");
      expect(service['IN_PROGRESS_STATUS']).toBe("En juego");
    });
  });

  describe("getWeekGames", () => {
    test("should fetch games for 10 days (today-1 to today+8) and return today's games", async () => {
      const todayGame = createMockGame({ code: "today-game" });
      const otherGame = createMockGame({ code: "other-game" });

      let callCount = 0;
      mockGetNextGames.mockImplementation(async () => {
        callCount++;
        return callCount === 2 ? [todayGame] : [otherGame]; // Second call is "today"
      });

      let iterationCount = 0;
      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 10; // 10 iterations total
        }),
        isSame: mock().mockImplementation((_date: any, _unit: string) => {
          return iterationCount === 2; // Second iteration is "today"
        })
      };

      Object.assign(mockDateChain, {
        add: mockDateChain.add,
        subtract: mockDateChain.subtract,
        isSameOrBefore: mockDateChain.isSameOrBefore,
        isSame: mockDateChain.isSame
      });

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['getWeekGames']();

      expect(mockGetNextGames).toHaveBeenCalledTimes(10);
      expect(mockSupabaseMethods.insertGames).toHaveBeenCalledTimes(10);
      expect(result).toEqual([todayGame]);
    });

    test("should handle empty game responses", async () => {
      mockGetNextGames.mockResolvedValue([]);

      let iterationCount = 0;
      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 10;
        }),
        isSame: mock().mockReturnValue(false)
      };

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['getWeekGames']();

      expect(result).toEqual([]);
      expect(mockSupabaseMethods.insertGames).toHaveBeenCalledTimes(10);
      expect(mockSupabaseMethods.insertGames).toHaveBeenCalledWith([]);
    });

    test("should handle getNextGames API failures", async () => {
      mockGetNextGames.mockRejectedValue(new Error("API Error"));

      let iterationCount = 0;
      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 1; // Only one iteration to test error
        }),
        isSame: mock().mockReturnValue(false)
      };

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['getWeekGames']();

      expect(result).toEqual([]);
      expect(mockTelegramMethods.sendError).toHaveBeenCalledWith("API Error", "getWeekGames");
    });

    test("should handle database insertion failures", async () => {
      const game = createMockGame();
      mockGetNextGames.mockResolvedValue([game]);
      mockSupabaseMethods.insertGames.mockRejectedValue(new Error("Database Error"));

      let iterationCount = 0;
      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 1;
        }),
        isSame: mock().mockReturnValue(false)
      };

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['getWeekGames']();

      expect(result).toEqual([]);
      expect(mockTelegramMethods.sendError).toHaveBeenCalledWith("Database Error", "getWeekGames");
    });
  });

  describe("startWeekGamesJob", () => {
    test("should schedule cron job with EVERY_DAY pattern and start it", async () => {
      const todayGame = createMockGame();
      mockGetNextGames.mockResolvedValue([todayGame]);

      // Mock the date chain for getWeekGames
      let iterationCount = 0;
      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 10;
        }),
        isSame: mock().mockImplementation(() => iterationCount === 5) // One day is "today"
      };

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['startWeekGamesJob']();

      expect(mockCron.schedule).toHaveBeenCalledWith("0 3 * * *", expect.any(Function));
      expect(mockJob.start).toHaveBeenCalled();
      expect(result).toBe(mockJob as any);
    });

    test("should not call getWeekGames immediately, only schedule the job", async () => {
      const mockGetWeekGames = spyOn(cronService as any, 'getWeekGames');

      await cronService['startWeekGamesJob']();

      // getWeekGames should NOT be called immediately, only when the cron job runs
      expect(mockGetWeekGames).not.toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledWith("0 3 * * *", expect.any(Function));
      expect(mockJob.start).toHaveBeenCalled();
    });

    test("should execute cron job callback correctly", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((_pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const mockDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockReturnValue(false), // No iterations for initial call
        isSame: mock().mockReturnValue(false)
      };

      mockDayjs.mockReturnValue(mockDateChain);

      await cronService['startWeekGamesJob']();

      // Reset iteration for callback test
      let callbackIterationCount = 0;
      const mockCallbackDateChain = {
        add: mock().mockReturnThis(),
        subtract: mock().mockReturnThis(),
        isSameOrBefore: mock().mockImplementation(() => {
          callbackIterationCount++;
          return callbackIterationCount <= 1;
        }),
        isSame: mock().mockReturnValue(true)
      };

      mockDayjs.mockReturnValue(mockCallbackDateChain);
      const todayGame = createMockGame();
      mockGetNextGames.mockResolvedValue([todayGame]);

      await cronCallback!();

      expect(mockGetNextGames).toHaveBeenCalled();
    });
  });

  describe("getGameUpdates", () => {
    test("should detect status changes", () => {
      const currentGame = createMockGame({ status: "Programado" });
      const liveGame = createMockGame({ status: "En juego" });

      const result = cronService['getGameUpdates'](currentGame, liveGame);

      expect(result.statusUpdate).toBe(true);
      expect(result.homeTeamScored).toBe(false);
      expect(result.awayTeamScored).toBe(false);
    });

    test("should detect home team scoring", () => {
      const currentGame = createMockGame({
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const liveGame = createMockGame({
        score: {
          homeTeam: { totalScore: "1", subScore: "1" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });

      const result = cronService['getGameUpdates'](currentGame, liveGame);

      expect(result.statusUpdate).toBe(false);
      expect(result.homeTeamScored).toBe(true);
      expect(result.awayTeamScored).toBe(false);
    });

    test("should detect away team scoring", () => {
      const currentGame = createMockGame({
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const liveGame = createMockGame({
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "1", subScore: "1" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });

      const result = cronService['getGameUpdates'](currentGame, liveGame);

      expect(result.statusUpdate).toBe(false);
      expect(result.homeTeamScored).toBe(false);
      expect(result.awayTeamScored).toBe(true);
    });

    test("should detect multiple simultaneous changes", () => {
      const currentGame = createMockGame({
        status: "Programado",
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const liveGame = createMockGame({
        status: "En juego",
        score: {
          homeTeam: { totalScore: "1", subScore: "1" },
          awayTeam: { totalScore: "2", subScore: "2" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });

      const result = cronService['getGameUpdates'](currentGame, liveGame);

      expect(result.statusUpdate).toBe(true);
      expect(result.homeTeamScored).toBe(true);
      expect(result.awayTeamScored).toBe(true);
    });

    test("should detect no changes", () => {
      const currentGame = createMockGame();
      const liveGame = createMockGame();

      const result = cronService['getGameUpdates'](currentGame, liveGame);

      expect(result.statusUpdate).toBe(false);
      expect(result.homeTeamScored).toBe(false);
      expect(result.awayTeamScored).toBe(false);
    });
  });

  describe("handleRealTimeGameJob", () => {
    test("should create minute-based cron job and start it", () => {
      const game = createMockGame();

      const result = cronService['handleRealTimeGameJob'](game);

      expect(mockCron.schedule).toHaveBeenCalledWith("* * * * *", expect.any(Function));
      expect(mockJob.start).toHaveBeenCalled();
      expect(result).toBe(mockJob as any);
    });

    test("should start tracking and schedule cron job", async () => {
      const game = createMockGame({ date: new Date("2024-01-15T15:00:00Z") });

      cronService['handleRealTimeGameJob'](game);

      // Should call trackerStart printer method
      expect(mockPrinterMethods.trackerStart).toHaveBeenCalledWith(
        game.home_team.fullName,
        game.away_team.fullName
      );

      // Should schedule a cron job with EVERY_MINUTE pattern
      expect(mockCron.schedule).toHaveBeenCalledWith("* * * * *", expect.any(Function));
      expect(mockJob.start).toHaveBeenCalled();
    });

    test("should fetch live games and process updates when game has started", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "game-123" });
      const liveGame = createMockGame({
        code: "game-123",
        status: "En juego",
        score: {
          homeTeam: { totalScore: "1", subScore: "1" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const currentGame = createMockGame({ code: "game-123" });

      const mockNow = {
        isBefore: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([liveGame]);
      mockSupabaseMethods.getGameByCode.mockResolvedValue(currentGame);

      cronService['handleRealTimeGameJob'](game);
      await cronCallback!();

      expect(mockGetNextGames).toHaveBeenCalledTimes(1);
      expect(mockSupabaseMethods.getGameByCode).toHaveBeenCalledWith("game-123");
      // Check that status change was detected
      expect(mockPrinterMethods.statusChanged).toHaveBeenCalledWith("En juego");
      // Check that goal was logged
      expect(mockPrinterMethods.goal).toHaveBeenCalled();
      expect(mockSupabaseMethods.updateGame).toHaveBeenCalledWith(liveGame);
    });

    test("should log when game is not found in live games", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "missing-game" });
      const mockNow = {
        isBefore: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([]);

      cronService['handleRealTimeGameJob'](game);
      await cronCallback!();

      // Check that gameNotFound printer method was called
      expect(mockPrinterMethods.gameNotFound).toHaveBeenCalledWith(
        game.home_team.fullName,
        game.away_team.fullName
      );
      expect(mockSupabaseMethods.getGameByCode).not.toHaveBeenCalled();
    });

    test("should stop job when game status is finished", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "game-123" });
      const finishedLiveGame = createMockGame({
        code: "game-123",
        status: "Finalizado"
      });
      const currentGame = createMockGame({ code: "game-123" });

      const mockNow = {
        isBefore: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([finishedLiveGame]);
      mockSupabaseMethods.getGameByCode.mockResolvedValue(currentGame);

      cronService['handleRealTimeGameJob'](game);
      await cronCallback!();

      expect(mockSupabaseMethods.updateGame).toHaveBeenCalledWith(finishedLiveGame);
      expect(mockJob.stop).toHaveBeenCalled();
    });

    test("should handle away team scoring detection", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "game-123" });
      const liveGame = createMockGame({
        code: "game-123",
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "1", subScore: "1" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const currentGame = createMockGame({ code: "game-123" });

      const mockNow = {
        isBefore: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([liveGame]);
      mockSupabaseMethods.getGameByCode.mockResolvedValue(currentGame);

      cronService['handleRealTimeGameJob'](game);
      await cronCallback!();

      // Check that goal printer method was called
      expect(mockPrinterMethods.goal).toHaveBeenCalled();
    });

    test("should log when no goals are scored and status remains the same", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "game-123", status: "En juego" });
      const liveGame = createMockGame({
        code: "game-123",
        status: "En juego",
        score: {
          homeTeam: { totalScore: "0", subScore: "0" },
          awayTeam: { totalScore: "0", subScore: "0" },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });
      const currentGame = createMockGame({ code: "game-123", status: "En juego" });

      const mockNow = {
        isBefore: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([liveGame]);
      mockSupabaseMethods.getGameByCode.mockResolvedValue(currentGame);

      cronService['handleRealTimeGameJob'](game);
      await cronCallback!();

      // Check that statusCurrent was called (no change)
      expect(mockPrinterMethods.statusCurrent).toHaveBeenCalledWith("En juego");

      // Check that noGoals printer method was called
      expect(mockPrinterMethods.noGoals).toHaveBeenCalled();

      // Ensure goal printer method was not called
      expect(mockPrinterMethods.goal).not.toHaveBeenCalled();

      expect(mockSupabaseMethods.updateGame).toHaveBeenCalledWith(liveGame);
    });

    test("should handle database errors gracefully", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      const game = createMockGame({ code: "game-123" });
      const liveGame = createMockGame({ code: "game-123" });

      const mockNow = {
        isBefore: mock().mockReturnValue(false),
        format: mock().mockReturnValue("15:30:00")
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (!date) return mockNow;
        return mockDayjs();
      });

      mockGetNextGames.mockResolvedValue([liveGame]);
      mockSupabaseMethods.getGameByCode.mockRejectedValue(new Error("Database Error"));

      cronService['handleRealTimeGameJob'](game);

      await cronCallback!();

      expect(mockTelegramMethods.sendError).toHaveBeenCalledWith(
        "Database Error",
        `Real-time tracker - ${game.home_team.fullName} vs ${game.away_team.fullName}`
      );
    });
  });

  describe("start", () => {
    test("should call serviceStart and schedule the weekly job", async () => {
      await cronService.start();

      expect(mockPrinterMethods.serviceStart).toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledWith("0 3 * * *", expect.any(Function));
      expect(mockJob.start).toHaveBeenCalled();
    });

    test("should call handleRealTimeGames when cron job callback executes with today's games", async () => {
      let weekGamesCronCallback: Function;

      // Capture both cron callbacks
      let callbackCount = 0;
      mockCron.schedule.mockImplementation((_, callback) => {
        callbackCount++;
        if (callbackCount === 1) {
          // First call is from startWeekGamesJob
          weekGamesCronCallback = callback;
        }
        return mockJob;
      });

      const todayGames = [
        createMockGame({
          code: "game-in-progress",
          status: "En juego",
          datetime: new Date(),
          home_team: { fullName: "Real Madrid" },
          away_team: { fullName: "Barcelona" }
        }),
        createMockGame({
          code: "game-scheduled",
          status: "Programado",
          datetime: new Date(),
          home_team: { fullName: "Atletico Madrid" },
          away_team: { fullName: "Sevilla" }
        })
      ];

      // Mock getWeekGames to return todayGames
      spyOn(cronService as any, 'getWeekGames').mockResolvedValue(todayGames);

      // Mock dayjs to make isToday() return true
      const mockDateInstance = {
        isToday: mock().mockReturnValue(true)
      };
      mockDayjs.mockImplementation((date?: any) => {
        if (date) return mockDateInstance;
        return createMockDayjs();
      });

      await cronService.start();

      // Execute the week games cron callback
      await weekGamesCronCallback!();

      // Check that printer methods were called
      expect(mockPrinterMethods.todaysGamesHeader).toHaveBeenCalledWith(2);
      expect(mockPrinterMethods.gameInfo).toHaveBeenCalledTimes(2);
      expect(mockPrinterMethods.trackerStart).toHaveBeenCalledTimes(2);
      // Verify that handleRealTimeGameJob was called (which schedules more cron jobs)
      expect(mockCron.schedule).toHaveBeenCalledTimes(3); // 1 for week job + 2 for real-time jobs
    });

    test("should handle empty games when cron callback executes", async () => {
      let cronCallback: Function;
      mockCron.schedule.mockImplementation((pattern, callback) => {
        cronCallback = callback;
        return mockJob;
      });

      // Mock getWeekGames to return empty array
      spyOn(cronService as any, 'getWeekGames').mockResolvedValue([]);

      await cronService.start();

      // Execute the cron callback
      await cronCallback!();

      // Should call noGamesToday when there are no games
      expect(mockPrinterMethods.noGamesToday).toHaveBeenCalled();
    });

    test("should not call handleRealTimeGameJob for games that are not today", async () => {
      const todayGames = [
        createMockGame({
          code: "game-tomorrow",
          status: "Programado",
          datetime: new Date(Date.now() + 86400000), // tomorrow
          home_team: { fullName: "Real Madrid" },
          away_team: { fullName: "Barcelona" }
        }),
        createMockGame({
          code: "game-yesterday",
          status: "Finalizado",
          datetime: new Date(Date.now() - 86400000), // yesterday
          home_team: { fullName: "Atletico Madrid" },
          away_team: { fullName: "Sevilla" }
        })
      ];

      // Mock getWeekGames to return todayGames (even though they're not today)
      let iterationCount = 0;
      const mockDateChain: any = {
        add: mock(),
        subtract: mock(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 10;
        }),
        isSame: mock().mockImplementation(() => iterationCount === 5)
      };
      mockDateChain.add.mockReturnValue(mockDateChain);
      mockDateChain.subtract.mockReturnValue(mockDateChain);

      // Mock isToday to return false for these games
      const mockDateInstance = {
        isToday: mock().mockReturnValue(false)
      };

      mockDayjs.mockImplementation((date?: any) => {
        if (date) return mockDateInstance;
        return mockDateChain;
      });

      mockGetNextGames.mockImplementation(async () => {
        return iterationCount === 5 ? todayGames : [];
      });

      const mockHandleRealTimeGameJob = spyOn(cronService as any, 'handleRealTimeGameJob').mockReturnValue(mockJob);

      await cronService.start();

      // handleRealTimeGameJob should not be called since games are not today
      expect(mockHandleRealTimeGameJob).not.toHaveBeenCalled();
    });

    test("should handle startWeekGamesJob errors", async () => {
      spyOn(cronService as any, 'startWeekGamesJob').mockRejectedValue(new Error("Job Error"));

      await expect(cronService.start()).rejects.toThrow("Job Error");
    });
  });

  describe("Integration scenarios", () => {
    test("should handle complete workflow with multiple games and updates", async () => {
      const todayGames = [
        createMockGame({
          code: "integration-game-1",
          status: "Programado",
          home_team: { fullName: "Real Madrid" },
          away_team: { fullName: "Barcelona" }
        }),
        createMockGame({
          code: "integration-game-2",
          status: "En juego",
          home_team: { fullName: "Atletico Madrid" },
          away_team: { fullName: "Sevilla" }
        })
      ];

      // Mock the complete flow
      let iterationCount = 0;
      const mockDateChain: any = {
        add: mock(),
        subtract: mock(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 10;
        }),
        isSame: mock().mockImplementation(() => iterationCount === 5)
      };
      mockDateChain.add.mockReturnValue(mockDateChain);
      mockDateChain.subtract.mockReturnValue(mockDateChain);

      mockDayjs.mockReturnValue(mockDateChain);
      mockGetNextGames.mockImplementation(async () => {
        return iterationCount === 5 ? todayGames : [];
      });

      await cronService.start();

      expect(mockCron.schedule).toHaveBeenCalledWith("0 3 * * *", expect.any(Function));
      // Real-time jobs are created based on today's games, which may be 0 in this mock setup
      expect(mockJob.start).toHaveBeenCalled();
      // Check that service started
      expect(mockPrinterMethods.serviceStart).toHaveBeenCalled();
    });
  });

  describe("Edge cases and error handling", () => {
    test("should handle malformed game data", () => {
      const malformedCurrentGame = createMockGame({
        score: {
          homeTeam: { totalScore: "", subScore: "" },
          awayTeam: { totalScore: null as any, subScore: null as any },
          winner: { id: "", name: "" },
          period: { id: 1, name: "Primera Parte", alternateNames: { esES: "Primera Parte", enEN: "First Half" } }
        }
      });

      const normalLiveGame = createMockGame();

      const result = cronService['getGameUpdates'](malformedCurrentGame, normalLiveGame);

      // Should handle malformed data gracefully
      expect(result.homeTeamScored).toBe(true); // "" !== "0"
      expect(result.awayTeamScored).toBe(true); // null !== "0"
    });

    test("should handle network timeouts in getNextGames", async () => {
      const timeoutError = new Error("Network timeout");
      mockGetNextGames.mockRejectedValue(timeoutError);

      let iterationCount = 0;
      const mockDateChain: any = {
        add: mock(),
        subtract: mock(),
        isSameOrBefore: mock().mockImplementation(() => {
          iterationCount++;
          return iterationCount <= 1;
        }),
        isSame: mock().mockReturnValue(false)
      };
      mockDateChain.add.mockReturnValue(mockDateChain);
      mockDateChain.subtract.mockReturnValue(mockDateChain);

      mockDayjs.mockReturnValue(mockDateChain);

      const result = await cronService['getWeekGames']();

      expect(result).toEqual([]);
      expect(mockTelegramMethods.sendError).toHaveBeenCalledWith("Network timeout", "getWeekGames");
    });
  });
});
