import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundingArea } from 'src/app/funder/models/public-profile.models';

@Component({
  selector: 'app-funder-what-we-fund',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .fund-section {
        position: relative;
        padding: 100px 60px;
        color: #fff;
        background-color: #1a1a2e;
        overflow: hidden;
      }

      .fund-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(16, 185, 129, 0.03);
      }

      .fund-container {
        position: relative;
        max-width: 1280px;
        margin: 0 auto;
      }

      .fund-header {
        margin-bottom: 60px;
      }

      .fund-header-label {
        font-size: 12px;
        letter-spacing: 2px;
        color: #10b981;
        text-transform: uppercase;
        margin-bottom: 12px;
        font-weight: 700;
      }

      .fund-header h2 {
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 20px;
        line-height: 1.2;
      }

      .fund-header p {
        font-size: 16px;
        opacity: 0.85;
        max-width: 600px;
        line-height: 1.6;
      }

      .fund-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }

      .fund-card {
        position: relative;
        padding: 32px;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 16px;
        background: rgba(16, 185, 129, 0.05);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .fund-card:hover {
        border-color: rgba(16, 185, 129, 0.6);
        background: rgba(16, 185, 129, 0.1);
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
      }

      .fund-card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 12px;
        margin-bottom: 20px;
      }

      .fund-card-icon svg {
        width: 24px;
        height: 24px;
        color: #fff;
      }

      .fund-card h3 {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #fff;
      }

      .fund-card p {
        font-size: 14px;
        opacity: 0.8;
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .fund-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .fund-card-tag {
        font-size: 11px;
        padding: 6px 12px;
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 20px;
        color: #10b981;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .fund-section {
          padding: 60px 24px;
        }

        .fund-header h2 {
          font-size: 32px;
        }

        .fund-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <section id="what-we-fund" class="fund-section">
      <div class="fund-container">
        <!-- Header -->
        <div class="fund-header">
          <div class="fund-header-label">Investment Sectors</div>
          <h2>What We Fund</h2>
          <p>
            Cutting-edge companies tackling tomorrow's problems in today's
            fastest-growing verticals.
          </p>
        </div>

        <!-- Grid -->
        <div class="fund-grid">
          @for (area of fundingAreas; track area.name) {
          <div class="fund-card">
            <div class="fund-card-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3>{{ area.name }}</h3>
            @if (area.description) {
            <p>{{ area.description }}</p>
            } @if (area.tags && area.tags.length > 0) {
            <div class="fund-card-tags">
              @for (tag of area.tags.slice(0, 3); track tag) {
              <span class="fund-card-tag">{{ tag }}</span>
              }
            </div>
            }
          </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class FunderWhatWeFundComponent {
  @Input() fundingAreas: FundingArea[] = [];
}
