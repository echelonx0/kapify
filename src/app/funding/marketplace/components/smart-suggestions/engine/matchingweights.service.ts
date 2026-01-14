import { inject, Injectable } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS,
} from './matching-engine.model';


// @Injectable({ providedIn: 'root' })
// export class MatchingWeightsService {
//   private supabase = inject(SharedSupabaseService);

//   private cachedWeights: MatchingWeights | null = null;

//   async getWeights(): Promise<MatchingWeights> {
//     if (this.cachedWeights) {
//       return this.cachedWeights;
//     }

//     try {
//       const { data, error } = await this.supabase
//         .from('matching_weights')
//         .select('key, value');

//       if (error || !data) {
//         this.cachedWeights = { ...DEFAULT_MATCHING_WEIGHTS };
//         return this.cachedWeights;
//       }

//       this.cachedWeights = {
//         ...DEFAULT_MATCHING_WEIGHTS,
//         ...Object.fromEntries(data.map((r) => [r.key, Number(r.value)])),
//       };
//       console.log('Fetched from Datsbase');
//       return this.cachedWeights!;
//     } catch {
//       this.cachedWeights = { ...DEFAULT_MATCHING_WEIGHTS };
//       return this.cachedWeights;
//     }
//   }

//   clearCache(): void {
//     this.cachedWeights = null;
//   }
// }

@Injectable({ providedIn: 'root' })
export class MatchingWeightsService {
  private supabase = inject(SharedSupabaseService);
  private cachedWeights: MatchingWeights | null = null;

  async getWeights(): Promise<MatchingWeights> {
    if (this.cachedWeights) return this.cachedWeights;

    try {
      const { data, error } = await this.supabase
        .from('matching_weights')
        .select('key, value');

      if (error || !data) {
        this.cachedWeights = { ...DEFAULT_MATCHING_WEIGHTS };
        return this.cachedWeights;
      }

      this.cachedWeights = {
        ...DEFAULT_MATCHING_WEIGHTS,
        ...Object.fromEntries(data.map((r) => [r.key, Number(r.value)])),
      };

      return this.cachedWeights!;
    } catch {
      this.cachedWeights = { ...DEFAULT_MATCHING_WEIGHTS };
      return this.cachedWeights;
    }
  }

  async saveWeights(weights: MatchingWeights): Promise<void> {
    try {
      const entries = Object.entries(weights).map(([key, value]) => ({
        key,
        value: value.toString(),
      }));

      for (const entry of entries) {
        await this.supabase
          .from('matching_weights')
          .upsert(entry, { onConflict: 'key' });
      }

      this.cachedWeights = { ...weights };
    } catch (err) {
      console.error('Failed to save matching weights', err);
      throw err;
    }
  }

  clearCache() {
    this.cachedWeights = null;
  }
}
