
// // src/app/shared/components/ui-card.component.ts
// import { Component, input, computed } from '@angular/core';

// @Component({
//   selector: 'ui-card',
//   standalone: true,
//   template: `
//     <div [class]="cardClasses()">
//       @if (title() || subtitle()) {
//         <div class="p-6 pb-4">
//           @if (title()) {
//             <h3 class="text-lg font-semibold text-neutral-900">{{ title() }}</h3>
//           }
//           @if (subtitle()) {
//             <p class="mt-1 text-sm text-neutral-600">{{ subtitle() }}</p>
//           }
//         </div>
//       }
//       <div [class]="contentClasses()">
//         <ng-content />
//       </div>
//     </div>
//   `,
// })
// export class UiCardComponent {
//   title = input<string>();
//   subtitle = input<string>();
//   padding = input(true);
//   hover = input(false);

//   cardClasses = computed(() => {
//     const baseClasses = 'bg-white rounded-lg border border-neutral-200 shadow-card';
//     const hoverClass = this.hover() ? 'hover:shadow-card-hover transition-shadow' : '';
//     return [baseClasses, hoverClass].filter(Boolean).join(' ');
//   });

//   contentClasses = computed(() => {
//     if (!this.padding()) return '';
//     return (this.title() || this.subtitle()) ? 'px-6 pb-6' : 'p-6';
//   });
// }

import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <div [class]="cardClasses()">
      <!-- Title & Subtitle -->
      @if (title() || subtitle()) {
        <div class="p-6 pb-4">
          @if (title()) {
            <h3 class="text-lg font-semibold text-neutral-900">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="mt-1 text-sm text-neutral-600">{{ subtitle() }}</p>
          }
        </div>
      }
      <!-- Content -->
      <div [class]="contentClasses()">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiCardComponent {
  title = input<string>();
  subtitle = input<string>();
  padding = input(true);
  hover = input(false);
  marginBottom = input(''); // new input for margin

  cardClasses = computed(() => {
    const baseClasses = 'bg-white rounded-lg border border-neutral-200 shadow-card';
    const hoverClass = this.hover() ? 'hover:shadow-card-hover transition-shadow' : '';
    const marginClass = this.marginBottom();
    return [baseClasses, hoverClass, marginClass].filter(Boolean).join(' ');
  });

  contentClasses = computed(() => {
    if (!this.padding()) return '';
    return (this.title() || this.subtitle()) ? 'px-6 pb-6' : 'p-6';
  });
}
