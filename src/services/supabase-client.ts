import { createClient, SupabaseClient as TSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class SupabaseClient {
  protected supabase: TSupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
}
