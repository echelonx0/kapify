import { Injectable } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface CheckoutSessionRequest {
  organizationId: string;
  creditAmount: number;
  amountZAR: number;
}

export interface CheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  publicKey?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly edgeFunctionUrl =
    'https://hsilpedhzelahseceats.supabase.co/functions/v1/stripe-checkout';

  constructor(private supabase: SharedSupabaseService) {}

  async createCheckoutSession(
    request: CheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    try {
      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          organizationId: request.organizationId,
          creditAmount: request.creditAmount,
          amountZAR: request.amountZAR,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to create checkout session',
        };
      }

      const data = await response.json();
      return {
        success: true,
        sessionId: data.sessionId,
        publicKey: data.publicKey,
      };
    } catch (error) {
      console.error('❌ Stripe error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Redirect to Stripe Checkout
   * Call this after successfully creating a session
   */
  async redirectToCheckout(
    sessionId: string,
    publicKey: string
  ): Promise<void> {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    document.body.appendChild(script);

    script.onload = async () => {
      const stripe = (window as any).Stripe(publicKey);
      await stripe.redirectToCheckout({ sessionId });
    };
  }

  async validateCheckoutSession(
    sessionId: string
  ): Promise<{ valid: boolean; data?: any }> {
    try {
      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();

      const response = await fetch(
        `${this.edgeFunctionUrl}?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.access_token || ''}`,
          },
        }
      );

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: data.session.payment_status === 'paid',
        data: data.session,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }
}
