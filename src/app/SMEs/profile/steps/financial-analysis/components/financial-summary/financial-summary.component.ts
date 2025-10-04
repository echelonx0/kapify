 
// // src/app/profile/steps/financial-analysis/components/financial-summary/financial-summary.component.ts
// import { Component, input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart } from 'lucide-angular';

// @Component({
//   selector: 'app-financial-summary',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <!-- Premium Gradient Container -->
//     <div class="relative overflow-hidden rounded-2xl" style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #fdc830 50%, #f37335 75%, #ff6b9d 100%);">
//       <!-- Gradient Overlay Pattern -->
//       <div class="absolute inset-0 opacity-10">
//         <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px); background-size: 30px 30px;"></div>
//       </div>

//       <!-- Content Container -->
//       <div class="relative p-8">
//         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
//           <!-- Left Section: Balance Card & Chart -->
//           <div class="space-y-6">
            
//             <!-- Balance Card - Glass Morphism -->
//             <div class="glass-card">
//               <div class="flex items-start justify-between mb-4">
//                 <div>
//                   <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Financial Health Score</p>
//                   <h3 class="text-3xl font-bold text-gray-900">{{ completionPercentage() }}%</h3>
//                 </div>
//                 <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
//                   <lucide-icon [name]="BarChartIcon" [size]="20"></lucide-icon>
//                 </div>
//               </div>
              
//               <!-- Progress Bar -->
//               <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
//                 <div 
//                   class="h-full rounded-full transition-all duration-700 ease-out"
//                   [style.width.%]="completionPercentage()"
//                   [ngClass]="getHealthScoreColor()">
//                 </div>
//               </div>
              
//               <p class="text-xs text-gray-500 mt-2">{{ getHealthScoreLabel() }}</p>
//             </div>

//             <!-- Chart Card - Glass Morphism -->
//             <div class="glass-card">
//               <div class="flex items-center justify-between mb-4">
//                 <h4 class="text-sm font-semibold text-gray-700">Data Overview</h4>
//                 <span class="text-xs text-gray-500">Completion Metrics</span>
//               </div>
              
//               <!-- Bar Chart Visualization -->
//               <div class="space-y-3">
//                 <div class="flex items-center gap-3">
//                   <div class="flex-1">
//                     <div class="flex items-center justify-between mb-1">
//                       <span class="text-xs font-medium text-gray-600">Income Statement</span>
//                       <span class="text-xs font-bold text-gray-900">{{ incomeStatementCount() }}</span>
//                     </div>
//                     <div class="w-full bg-gray-200 rounded-full h-2">
//                       <div 
//                         class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
//                         [style.width.%]="getIncomeBarWidth()">
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div class="flex items-center gap-3">
//                   <div class="flex-1">
//                     <div class="flex items-center justify-between mb-1">
//                       <span class="text-xs font-medium text-gray-600">Financial Ratios</span>
//                       <span class="text-xs font-bold text-gray-900">{{ financialRatiosCount() }}</span>
//                     </div>
//                     <div class="w-full bg-gray-200 rounded-full h-2">
//                       <div 
//                         class="bg-gradient-to-r from-stone-400 to-stone-600 h-2 rounded-full transition-all duration-500"
//                         [style.width.%]="getRatiosBarWidth()">
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <!-- Right Section: Key Metrics -->
//           <div class="space-y-4">
            
//             <!-- Metric Card 1 -->
//             <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
//               <div class="flex items-center gap-4">
//                 <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
//                   <lucide-icon [name]="TrendingUpIcon" [size]="24"></lucide-icon>
//                 </div>
//                 <div class="flex-1 min-w-0">
//                   <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Completion</p>
//                   <p class="text-2xl font-bold text-gray-900">{{ completionPercentage() }}%</p>
//                   <p class="text-xs text-gray-600 mt-0.5">{{ getCompletionStatus() }}</p>
//                 </div>
//               </div>
//             </div>

//             <!-- Metric Card 2 -->
//             <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
//               <div class="flex items-center gap-4">
//                 <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
//                   <lucide-icon [name]="DollarSignIcon" [size]="24"></lucide-icon>
//                 </div>
//                 <div class="flex-1 min-w-0">
//                   <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Income Items</p>
//                   <p class="text-2xl font-bold text-gray-900">{{ incomeStatementCount() }}</p>
//                   <p class="text-xs text-gray-600 mt-0.5">Financial entries tracked</p>
//                 </div>
//               </div>
//             </div>

//             <!-- Metric Card 3 -->
//             <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
//               <div class="flex items-center gap-4">
//                 <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center text-white flex-shrink-0">
//                   <lucide-icon [name]="PieChartIcon" [size]="24"></lucide-icon>
//                 </div>
//                 <div class="flex-1 min-w-0">
//                   <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Financial Ratios</p>
//                   <p class="text-2xl font-bold text-gray-900">{{ financialRatiosCount() }}</p>
//                   <p class="text-xs text-gray-600 mt-0.5">Key performance indicators</p>
//                 </div>
//               </div>
//             </div>

//             <!-- Validation Status -->
//             @if (!isValidTemplate()) {
//               <div class="glass-card border-2 border-orange-300">
//                 <div class="flex items-start gap-3">
//                   <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
//                     <lucide-icon [name]="TrendingDownIcon" [size]="18"></lucide-icon>
//                   </div>
//                   <div class="flex-1 min-w-0">
//                     <p class="text-xs font-semibold text-orange-800 mb-1">Template Structure Issue</p>
//                     <p class="text-xs text-orange-700">The uploaded template doesn't match the expected format. Some features may not work correctly.</p>
//                   </div>
//                 </div>
//               </div>
//             }
//           </div>

//         </div>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .glass-card {
//       background: rgba(255, 255, 255, 0.95);
//       backdrop-filter: blur(20px);
//       border-radius: 1rem;
//       padding: 1.25rem;
//       border: 1px solid rgba(255, 255, 255, 0.3);
//       box-shadow: 
//         0 10px 25px -5px rgba(0, 0, 0, 0.1),
//         0 8px 10px -6px rgba(0, 0, 0, 0.1),
//         inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
//       transition: all 0.3s ease;
//     }

//     .glass-card:hover {
//       box-shadow: 
//         0 20px 40px -10px rgba(0, 0, 0, 0.15),
//         0 12px 15px -8px rgba(0, 0, 0, 0.1),
//         inset 0 1px 0 0 rgba(255, 255, 255, 0.7);
//     }
//   `]
// })
// export class FinancialSummaryComponent {
//   // Inputs
//   completionPercentage = input<number>(0);
//   incomeStatementCount = input<number>(0);
//   financialRatiosCount = input<number>(0);
//   isValidTemplate = input<boolean>(true);

//   // Icons
//   TrendingUpIcon = TrendingUp;
//   TrendingDownIcon = TrendingDown;
//   DollarSignIcon = DollarSign;
//   BarChartIcon = BarChart3;
//   PieChartIcon = PieChart;

//   // Computed bar widths (scaled to make visualization meaningful)
//   getIncomeBarWidth = computed(() => {
//     const count = this.incomeStatementCount();
//     const maxExpected = 15; // Expected max income items
//     return Math.min((count / maxExpected) * 100, 100);
//   });

//   getRatiosBarWidth = computed(() => {
//     const count = this.financialRatiosCount();
//     const maxExpected = 12; // Expected max ratio items
//     return Math.min((count / maxExpected) * 100, 100);
//   });

//   // Health score styling
//   getHealthScoreColor(): string {
//     const score = this.completionPercentage();
//     if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
//     if (score >= 60) return 'bg-gradient-to-r from-blue-400 to-blue-600';
//     if (score >= 40) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
//     return 'bg-gradient-to-r from-orange-400 to-red-500';
//   }

//   getHealthScoreLabel(): string {
//     const score = this.completionPercentage();
//     if (score >= 80) return 'Excellent - Ready for institutional review';
//     if (score >= 60) return 'Good - Most data captured';
//     if (score >= 40) return 'Fair - Continue adding data';
//     return 'Needs attention - Add more financial information';
//   }

//   getCompletionStatus(): string {
//     const score = this.completionPercentage();
//     if (score >= 80) return 'Institutional ready';
//     if (score >= 60) return 'Nearly complete';
//     if (score >= 40) return 'In progress';
//     return 'Just started';
//   }
// }

// src/app/profile/steps/financial-analysis/components/financial-summary/financial-summary.component.ts
import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart } from 'lucide-angular';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Premium Gradient Container -->
    <div class="relative overflow-hidden rounded-2xl" style="background: linear-gradient(135deg, #475569 0%, #64748b 25%, #94a3b8 50%, #cbd5e1 75%, #e2e8f0 100%);">
      <!-- Gradient Overlay Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px); background-size: 30px 30px;"></div>
      </div>

      <!-- Content Container -->
      <div class="relative p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Left Section: Balance Card & Chart -->
          <div class="space-y-6">
            
            <!-- Balance Card - Glass Morphism -->
            <div class="glass-card">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Financial Health Score</p>
                  <h3 class="text-3xl font-bold text-gray-900">{{ completionPercentage() }}%</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
                  <lucide-icon [name]="BarChartIcon" [size]="20"></lucide-icon>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-700 ease-out"
                  [style.width.%]="completionPercentage()"
                  [ngClass]="getHealthScoreColor()">
                </div>
              </div>
              
              <p class="text-xs text-gray-500 mt-2">{{ getHealthScoreLabel() }}</p>
            </div>

            <!-- Chart Card - Glass Morphism -->
            <div class="glass-card">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-700">Data Overview</h4>
                <span class="text-xs text-gray-500">Completion Metrics</span>
              </div>
              
              <!-- Bar Chart Visualization -->
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-gray-600">Income Statement</span>
                      <span class="text-xs font-bold text-gray-900">{{ incomeStatementCount() }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        [style.width.%]="getIncomeBarWidth()">
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-gray-600">Financial Ratios</span>
                      <span class="text-xs font-bold text-gray-900">{{ financialRatiosCount() }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-gradient-to-r from-stone-400 to-stone-600 h-2 rounded-full transition-all duration-500"
                        [style.width.%]="getRatiosBarWidth()">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Section: Key Metrics -->
          <div class="space-y-4">
            
            <!-- Metric Card 1 -->
            <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                  <lucide-icon [name]="TrendingUpIcon" [size]="24"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Completion</p>
                  <p class="text-2xl font-bold text-gray-900">{{ completionPercentage() }}%</p>
                  <p class="text-xs text-gray-600 mt-0.5">{{ getCompletionStatus() }}</p>
                </div>
              </div>
            </div>

            <!-- Metric Card 2 -->
            <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <lucide-icon [name]="DollarSignIcon" [size]="24"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Income Items</p>
                  <p class="text-2xl font-bold text-gray-900">{{ incomeStatementCount() }}</p>
                  <p class="text-xs text-gray-600 mt-0.5">Financial entries tracked</p>
                </div>
              </div>
            </div>

            <!-- Metric Card 3 -->
            <div class="glass-card hover:scale-[1.02] transition-transform duration-200">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center text-white flex-shrink-0">
                  <lucide-icon [name]="PieChartIcon" [size]="24"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Financial Ratios</p>
                  <p class="text-2xl font-bold text-gray-900">{{ financialRatiosCount() }}</p>
                  <p class="text-xs text-gray-600 mt-0.5">Key performance indicators</p>
                </div>
              </div>
            </div>

            <!-- Validation Status -->
            @if (!isValidTemplate()) {
              <div class="glass-card border-2 border-orange-300">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                    <lucide-icon [name]="TrendingDownIcon" [size]="18"></lucide-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-orange-800 mb-1">Template Structure Issue</p>
                    <p class="text-xs text-orange-700">The uploaded template doesn't match the expected format. Some features may not work correctly.</p>
                  </div>
                </div>
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 8px 10px -6px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .glass-card:hover {
      box-shadow: 
        0 20px 40px -10px rgba(0, 0, 0, 0.15),
        0 12px 15px -8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.7);
    }
  `]
})
export class FinancialSummaryComponent {
  // Inputs
  completionPercentage = input<number>(0);
  incomeStatementCount = input<number>(0);
  financialRatiosCount = input<number>(0);
  isValidTemplate = input<boolean>(true);

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  BarChartIcon = BarChart3;
  PieChartIcon = PieChart;

  // Computed bar widths (scaled to make visualization meaningful)
  getIncomeBarWidth = computed(() => {
    const count = this.incomeStatementCount();
    const maxExpected = 15; // Expected max income items
    return Math.min((count / maxExpected) * 100, 100);
  });

  getRatiosBarWidth = computed(() => {
    const count = this.financialRatiosCount();
    const maxExpected = 12; // Expected max ratio items
    return Math.min((count / maxExpected) * 100, 100);
  });

  // Health score styling
  getHealthScoreColor(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (score >= 40) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    return 'bg-gradient-to-r from-orange-400 to-red-500';
  }

  getHealthScoreLabel(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'Excellent - Ready for institutional review';
    if (score >= 60) return 'Good - Most data captured';
    if (score >= 40) return 'Fair - Continue adding data';
    return 'Needs attention - Add more financial information';
  }

  getCompletionStatus(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'Institutional ready';
    if (score >= 60) return 'Nearly complete';
    if (score >= 40) return 'In progress';
    return 'Just started';
  }
}