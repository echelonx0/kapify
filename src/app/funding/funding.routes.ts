 

// src/app/funding/funding.routes.ts
import { Routes } from '@angular/router';

export const fundingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./funding.component').then(c => c.FundingComponent),
    children: [
      { 
        path: '', 
        redirectTo: 'opportunities', 
        pathMatch: 'full' as 'full' 
      },
      { 
        path: 'opportunities', 
        loadComponent: () => import('./funding-opportunities/opportunities-list/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent),
        title: 'Funding Opportunities - Kapify'
      },
      { 
        path: 'opportunities/:id', 
        loadComponent: () => import('./funding-detail.component').then(c => c.OpportunityDetailsComponent),
        title: 'Opportunity Details - Kapify'
      },
      { 
        path: 'create-opportunity', 
        loadComponent: () => import('../funder/components/create-opportunity/create-opportunity.component').then(c => c.CreateOpportunityComponent),
        title: 'Create Opportunity - Kapify'
      },
       { 
        path: 'opportunities/:id/edit', 
        loadComponent: () => import('../funder/components/create-opportunity/create-opportunity.component').then(c => c.CreateOpportunityComponent),
        title: 'Edit Opportunity - Kapify'
      }
    ]
  }
];