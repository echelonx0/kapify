import { inject, Injectable } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private supabase = inject(SharedSupabaseService);

  async getFunderName(funderId: string): Promise<string> {
    console.log(`FunderID is  ${funderId}`);
    const { data, error } = await this.supabase
      .from('organizations')
      .select('name')
      .eq('id', funderId)
      .single();

    if (error) {
      console.error('Error fetching funder name:', error);
      return 'Unknown Funder';
    }

    return data?.name || 'Unknown Funder';
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', orgId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    return data;
  }
}
