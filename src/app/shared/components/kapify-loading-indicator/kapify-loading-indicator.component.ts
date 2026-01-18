import { Component, Input } from '@angular/core';

@Component({
  selector: 'kapify-capital-loader',
  standalone: true,
  template: `
    <div
      class="relative inline-block select-none"
      role="status"
      aria-label="Loading"
    >
      <!-- Animated text -->
      <span
        class="
          text-3xl
          font-semibold
          tracking-wide
          text-transparent
          bg-clip-text
          bg-[length:200%_100%]
          animate-capital-flow
        "
        [class.text-4xl]="size === 'lg'"
        [class.text-2xl]="size === 'sm'"
      >
        kapify
      </span>

      <!-- Subtle underline (optional but recommended) -->
      <span
        class="
          absolute
          left-0
          -bottom-1
          h-px
          w-full
          bg-gradient-to-r
          from-transparent
          via-current
          to-transparent
          opacity-30
        "
      ></span>
    </div>
  `,
  styles: [
    `
      :host {
        --kapify-flow-from: theme(colors.slate.400);
        --kapify-flow-mid: theme(colors.emerald.500);
        --kapify-flow-to: theme(colors.slate.400);
        color: theme(colors.slate.700);
      }

      :host-context(.dark) {
        --kapify-flow-from: theme(colors.slate.500);
        --kapify-flow-mid: theme(colors.emerald.400);
        --kapify-flow-to: theme(colors.slate.500);
        color: theme(colors.slate.200);
      }

      @keyframes capitalFlow {
        0% {
          background-position: 0% 50%;
          opacity: 0.85;
        }
        50% {
          opacity: 1;
        }
        100% {
          background-position: 200% 50%;
          opacity: 0.85;
        }
      }

      .animate-capital-flow {
        background-image: linear-gradient(
          90deg,
          var(--kapify-flow-from),
          var(--kapify-flow-mid),
          var(--kapify-flow-to)
        );
        animation: capitalFlow 1.6s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-capital-flow {
          animation: none;
          background-position: 50% 50%;
        }
      }
    `,
  ],
})
export class KapifyCapitalLoaderComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
