import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';


const supabaseUrl = environment.SUPABASE_URL;
const supabaseKey = environment.SUPABASE_ANON_KEY;

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public client: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  get auth() {
    return this.client.auth;
  }

  get profileTable() {
    return this.client.from('profiles');
  }

  get predictionsTable() {
    return this.client.from('predictions');
  }

  get matchesTable() {
    return this.client.from('matches');
  }

  async uploadProof(file: File, userId: string): Promise<string> {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await this.client.storage
      .from('proofs')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrl } = this.client.storage
      .from('proofs')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }
}
