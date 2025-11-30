import { PollsService, type PublicGuessesPoll } from "./polls";
import { SupabaseClient } from "./supabase-client";

type SupabaseUserStatsEntry = {
  user_id: string;
  total_submitted: number;
  total_finished: number;
  total_successful: number;
  success_rate: number;
  current_streak: number;
  best_streak: number;
  average_score_diff: number;
  tournament_stats: unknown;
  created_at: Date;
  updated_at: Date;
};

type CreationUserStatsEntry = Omit<
  SupabaseUserStatsEntry,
  "created_at" | "updated_at"
>;

export class UserStatsService extends SupabaseClient {
  private USER_STATS_TABLE = "public_poll_stats";
  private emptyStats: CreationUserStatsEntry = {
    user_id: "",
    total_submitted: 0,
    total_finished: 0,
    total_successful: 0,
    success_rate: 0,
    current_streak: 0,
    best_streak: 0,
    average_score_diff: 0,
    tournament_stats: {},
  };

  private pollsService: PollsService;

  constructor() {
    super();

    this.pollsService = new PollsService();
  }

  async handleFinishedGame(gameCode: string) {
    const publicPoll = await this.pollsService.getPublicPoll(gameCode);

    if (!publicPoll) {
      console.error("Public poll not found for game code:", gameCode);
      return;
    }

    const finalResult = {
      homeTeam: parseInt(publicPoll.games.score.homeTeam.totalScore),
      awayTeam: parseInt(publicPoll.games.score.awayTeam.totalScore),
    };

    const updateStatsPromises = publicPoll.guesses.map(async (guess) => {
      const isSuccessful = this.isSuccessfulGuess(guess, finalResult);

      const currentStats =
        (await this.getUserStats(guess.author)) ?? this.emptyStats;

      let updatedStats: CreationUserStatsEntry = {
        ...currentStats,
        total_finished: currentStats.total_finished + 1,
      };

      if (isSuccessful) {
        updatedStats.current_streak = currentStats.current_streak + 1;
        updatedStats.best_streak = Math.max(
          currentStats.best_streak,
          currentStats.current_streak + 1,
        );
        updatedStats.total_successful = currentStats.total_successful + 1;
      } else {
        updatedStats.current_streak = 0;
      }

      updatedStats.success_rate =
        updatedStats.total_successful / updatedStats.total_finished;

      await this.upsertUserStats(updatedStats);
    });

    await Promise.all(updateStatsPromises);
  }

  private isSuccessfulGuess(
    guess: PublicGuessesPoll["guesses"][number],
    correctResult: { homeTeam: number; awayTeam: number },
  ) {
    return (
      guess.home_team_score === correctResult.homeTeam &&
      guess.away_team_score === correctResult.awayTeam
    );
  }

  private async upsertUserStats(stats: CreationUserStatsEntry) {
    const { data, error } = await this.supabase
      .from(this.USER_STATS_TABLE)
      .upsert(stats)
      .eq("user_id", stats.user_id)
      .single();

    if (error) {
      console.error("Error upserting user stats:", error);
      return null;
    }

    if (!data) {
      console.error("No data returned after upserting user stats");
      return null;
    }

    return data;
  }

  private async getUserStats(
    userId: string,
  ): Promise<SupabaseUserStatsEntry | null> {
    const { data, error } = await this.supabase
      .from(this.USER_STATS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }

    if (!data) {
      console.error("No data returned after fetching user stats");
      return null;
    }

    return data;
  }
}
