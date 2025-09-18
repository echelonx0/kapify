// src/app/shared/components/success-page/success-page.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  CheckCircle, 
  ArrowLeft, 
  MessageCircle, 
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Import
} from 'lucide-angular';
import { UiButtonComponent } from '../ui-button.component';
 
export type SuccessType = 
  | 'opportunity_created'
  | 'opportunity_imported' 
  | 'application_approved'
  | 'application_submitted'
  | 'profile_verified'
  | 'profile_completed'
  | 'team_member_added'
  | 'integration_connected';

interface SuccessConfig {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  iconColor: string;
  primaryAction: {
    label: string;
    route: string;
    icon?: any;
  };
  nextSteps: string[];
}

@Component({
  selector: 'app-success-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div class="max-w-2xl w-full">
        
        <!-- Success Card -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          <!-- Header Section -->
          <div class="text-center p-8 pb-6">
            <!-- Success Icon -->
            <div class="relative mb-6">
              <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center shadow-lg">
                <lucide-icon [img]="CheckCircleIcon" [size]="40" class="text-white" />
              </div>
              <!-- Feature Icon Overlay -->
              <div 
                class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                [class]="config.iconColor"
              >
                <lucide-icon [img]="config.icon" [size]="16" class="text-white" />
              </div>
            </div>

            <!-- Success Message -->
            <h1 class="text-3xl font-bold text-gray-900 mb-3">
              {{ config.title }}
            </h1>
            <p class="text-xl text-gray-600 mb-4">
              {{ config.subtitle }}
            </p>
            <p class="text-gray-500 leading-relaxed max-w-lg mx-auto">
              {{ config.description }}
            </p>
          </div>

          <!-- Next Steps Section -->
          @if (config.nextSteps.length > 0) {
            <div class="px-8 pb-6">
              <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                <div class="flex items-center mb-4">
                  <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <lucide-icon [img]="LightbulbIcon" [size]="16" class="text-white" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900">Suggested Next Steps</h3>
                </div>
                <ul class="space-y-3">
                  @for (step of config.nextSteps; track $index) {
                    <li class="flex items-start">
                      <div class="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span class="text-gray-700">{{ step }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          }

          <!-- Action Buttons -->
          <div class="px-8 pb-8">
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Primary Action -->
              <ui-button 
                variant="primary" 
                (clicked)="handlePrimaryAction()" 
                class="flex-1 shadow-lg"
              >
                @if (config.primaryAction.icon) {
                  <lucide-icon [img]="config.primaryAction.icon" [size]="16" class="mr-2" />
                }
                {{ config.primaryAction.label }}
              </ui-button>

              <!-- Secondary Actions -->
              <ui-button 
                variant="outline" 
                (clicked)="goToDashboard()"
                class="sm:w-auto"
              >
                <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-2" />
                Back to Dashboard
              </ui-button>

              <ui-button 
                variant="ghost" 
                (clicked)="contactSupport()"
                class="sm:w-auto text-gray-600 hover:text-gray-800"
              >
                <lucide-icon [img]="MessageCircleIcon" [size]="16" class="mr-2" />
                Contact Support
              </ui-button>
            </div>
          </div>

        </div>

        <!-- Additional Info -->
        <div class="text-center mt-6">
          <p class="text-sm text-gray-500">
            Need help getting started? 
            <button 
              (click)="contactSupport()" 
              class="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Contact our support team
            </button>
          </p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .success-card-enter {
      animation: slideInUp 0.6s ease-out;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon-bounce {
      animation: bounce 1s infinite;
    }

    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
      }
      40%, 43% {
        transform: translate3d(0,-8px,0);
      }
      70% {
        transform: translate3d(0,-4px,0);
      }
      90% {
        transform: translate3d(0,-2px,0);
      }
    }
  `]
})
export class SuccessPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  CheckCircleIcon = CheckCircle;
  ArrowLeftIcon = ArrowLeft;
  MessageCircleIcon = MessageCircle;
  ArrowRightIcon = ArrowRight;
  LightbulbIcon = Lightbulb;

  // Configuration
  config!: SuccessConfig;
  successType = signal<SuccessType>('opportunity_created');
  entityId = signal<string | null>(null);

  // Success configurations
  private successConfigs: Record<SuccessType, SuccessConfig> = {
    opportunity_created: {
      title: 'Opportunity Published Successfully!',
      subtitle: 'Your funding opportunity is now live and visible to SMEs',
      description: 'SMEs can now discover and apply to your opportunity. You\'ll receive notifications when applications start coming in.',
      icon: TrendingUp,
      iconColor: 'bg-blue-500',
      primaryAction: {
        label: 'View Applications',
        route: '/funder/opportunities/{id}/applications',
        icon: ArrowRight
      },
      nextSteps: [
        'Share your opportunity link with potential applicants',
        'Set up application review workflows',
        'Monitor application metrics on your dashboard',
        'Prepare evaluation criteria for incoming applications'
      ]
    },
    opportunity_imported: {
      title: 'Opportunity Imported Successfully!',
      subtitle: 'Your opportunity has been imported and is ready for review',
      description: 'Review the imported details and publish when ready. You can make any necessary adjustments before going live.',
      icon: Import,
      iconColor: 'bg-purple-500',
      primaryAction: {
        label: 'Review & Publish',
        route: '/funder/opportunities/{id}/edit',
        icon: ArrowRight
      },
      nextSteps: [
        'Review all imported opportunity details',
        'Adjust application requirements if needed',
        'Set your preferred application deadline',
        'Publish to start receiving applications'
      ]
    },
    application_approved: {
      title: 'Application Approved!',
      subtitle: 'The application has been successfully approved',
      description: 'The applicant will be notified of the approval. You can now proceed with the next steps in your funding process.',
      icon: CheckCircle,
      iconColor: 'bg-green-500',
      primaryAction: {
        label: 'View Application',
        route: '/funder/applications/{id}',
        icon: FileText
      },
      nextSteps: [
        'Contact the applicant to discuss next steps',
        'Prepare funding agreement documentation',
        'Schedule due diligence meetings',
        'Set up milestone tracking for the funding'
      ]
    },
    application_submitted: {
      title: 'Application Submitted Successfully!',
      subtitle: 'Your application is now under review',
      description: 'The funder will review your application and get back to you. You can track the status in your applications dashboard.',
      icon: FileText,
      iconColor: 'bg-blue-500',
      primaryAction: {
        label: 'View Application',
        route: '/applications/{id}',
        icon: ArrowRight
      },
      nextSteps: [
        'Prepare additional documents if requested',
        'Monitor your application status regularly',
        'Continue improving your business profile',
        'Apply to other relevant opportunities'
      ]
    },
    profile_verified: {
      title: 'Profile Verified Successfully!',
      subtitle: 'Your organization is now verified',
      description: 'Congratulations! Your verified status will build trust with SMEs and unlock premium features.',
      icon: Shield,
      iconColor: 'bg-green-500',
      primaryAction: {
        label: 'Create Opportunity',
        route: '/funding/create-opportunity',
        icon: TrendingUp
      },
      nextSteps: [
        'Create your first funding opportunity',
        'Set up your public funder profile',
        'Explore advanced analytics features',
        'Connect with verified SMEs in your network'
      ]
    },
    profile_completed: {
      title: 'Profile Completed!',
      subtitle: 'Your business profile is now complete',
      description: 'A complete profile increases your chances of getting approved for funding opportunities by up to 300%.',
      icon: Users,
      iconColor: 'bg-cyan-500',
      primaryAction: {
        label: 'Browse Opportunities',
        route: '/opportunities',
        icon: TrendingUp
      },
      nextSteps: [
        'Browse available funding opportunities',
        'Apply to opportunities that match your business',
        'Request verification to build trust',
        'Connect with potential funding partners'
      ]
    },
    team_member_added: {
      title: 'Team Member Added!',
      subtitle: 'Your team member has been successfully invited',
      description: 'They will receive an invitation email to join your organization. You can manage team permissions anytime.',
      icon: Users,
      iconColor: 'bg-purple-500',
      primaryAction: {
        label: 'Manage Team',
        route: '/settings?tab=members',
        icon: Users
      },
      nextSteps: [
        'Set appropriate permissions for team members',
        'Create role-based access for different functions',
        'Monitor team activity in the dashboard',
        'Invite additional team members as needed'
      ]
    },
    integration_connected: {
      title: 'Integration Connected!',
      subtitle: 'Your integration is now active',
      description: 'Data will start syncing automatically. You can monitor the integration status in your settings.',
      icon: Shield,
      iconColor: 'bg-indigo-500',
      primaryAction: {
        label: 'View Integrations',
        route: '/settings?tab=integrations',
        icon: ArrowRight
      },
      nextSteps: [
        'Test the integration with sample data',
        'Configure automatic sync preferences',
        'Set up integration monitoring alerts',
        'Explore additional integration options'
      ]
    }
  };

  ngOnInit() {
    // Get success type and entity ID from route
    this.route.paramMap.subscribe(params => {
      const type = params.get('type') as SuccessType;
      const id = params.get('id');
      
      if (type && this.successConfigs[type]) {
        this.successType.set(type);
        this.entityId.set(id);
        this.config = this.successConfigs[type];
        
        // Replace {id} placeholder in route if entity ID exists
        if (id && this.config.primaryAction.route.includes('{id}')) {
          this.config.primaryAction.route = this.config.primaryAction.route.replace('{id}', id);
        }
      } else {
        // Fallback to opportunity created if type is invalid
        this.successType.set('opportunity_created');
        this.config = this.successConfigs['opportunity_created'];
      }
    });
  }

  handlePrimaryAction() {
    this.router.navigate([this.config.primaryAction.route]);
  }

  goToDashboard() {
    // Navigate to appropriate dashboard based on user type
    // This could be determined by a service or user context
    this.router.navigate(['/dashboard']);
  }

  contactSupport() {
    // Open support - could be modal, email, or external link
    window.open('mailto:support@platform.com?subject=Need Help&body=Hi, I need assistance with my account.', '_blank');
  }
}