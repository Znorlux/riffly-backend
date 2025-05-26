import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class S3FakeClient {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_KEY ?? '',
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
