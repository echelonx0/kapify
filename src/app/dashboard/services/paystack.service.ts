// import { Injectable, signal } from '@angular/core';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// // Import Paystack from NPM package
// import PaystackPop from '@paystack/inline-js';

// export interface PaystackCheckoutRequest {
//   organizationId: string;
//   creditAmount: number;
//   amountZAR: number;
// }

// export interface PaystackCheckoutResponse {
//   success: boolean;
//   accessCode?: string;
//   authorizationUrl?: string;
//   error?: string;
// }

// export interface PaystackVerificationResponse {
//   success: boolean;
//   data?: {
//     reference: string;
//     amount: number;
//     status: 'success' | 'failed' | 'pending';
//     paidAt: string;
//     customer: {
//       email: string;
//     };
//   };
//   error?: string;
// }

// @Injectable({ providedIn: 'root' })
// export class PaystackService {
//   private readonly initializeFunctionUrl =
//     'https://hsilpedhzelahseceats.supabase.co/functions/v1/paystack-initialize';
//   private readonly verifyFunctionUrl =
//     'https://hsilpedhzelahseceats.supabase.co/functions/v1/paystack-verify';

//   isInitializing = signal(false);
//   initError = signal<string | null>(null);

//   constructor(private supabase: SharedSupabaseService) {
//     console.log('✅ PaystackService initialized with NPM package');
//     console.log('   PaystackPop available:', typeof PaystackPop);
//   }

//   /**
//    * Initialize Paystack transaction
//    * Returns access code needed for Paystack Popup
//    */
//   async initializeTransaction(
//     request: PaystackCheckoutRequest
//   ): Promise<PaystackCheckoutResponse> {
//     try {
//       this.isInitializing.set(true);
//       this.initError.set(null);

//       const {
//         data: { session },
//       } = await this.supabase.client.auth.getSession();

//       const response = await fetch(this.initializeFunctionUrl, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${session?.access_token || ''}`,
//         },
//         body: JSON.stringify({
//           organizationId: request.organizationId,
//           creditAmount: request.creditAmount,
//           amountZAR: request.amountZAR,
//         }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         const errorMsg = error.error || 'Failed to initialize payment';
//         this.initError.set(errorMsg);
//         return {
//           success: false,
//           error: errorMsg,
//         };
//       }

//       const data = await response.json();
//       this.isInitializing.set(false);

//       console.log('✅ Payment initialized with access code:', data.accessCode);

//       return {
//         success: true,
//         accessCode: data.accessCode,
//         authorizationUrl: data.authorizationUrl,
//       };
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : 'Unknown error';
//       this.initError.set(errorMsg);
//       this.isInitializing.set(false);
//       console.error('❌ Paystack init error:', error);
//       return {
//         success: false,
//         error: errorMsg,
//       };
//     }
//   }

//   /**
//    * Verify payment after Paystack Popup closes
//    * Called from success callback with transaction reference
//    */
//   async verifyPayment(
//     reference: string
//   ): Promise<PaystackVerificationResponse> {
//     try {
//       const {
//         data: { session },
//       } = await this.supabase.client.auth.getSession();

//       const response = await fetch(
//         `${this.verifyFunctionUrl}?reference=${encodeURIComponent(reference)}`,
//         {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${session?.access_token || ''}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const error = await response.json();
//         return {
//           success: false,
//           error: error.error || 'Verification failed',
//         };
//       }

//       const data = await response.json();
//       return {
//         success: data.status === 'success',
//         data: data.data,
//         error: data.error,
//       };
//     } catch (error) {
//       console.error('❌ Paystack verify error:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Verification error',
//       };
//     }
//   }

//   /**
//    * Open Paystack Popup with access code using NPM package
//    * No CDN, no timing issues
//    * Returns promise that resolves with reference on success
//    */
//   async openPaystackPopup(accessCode: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       try {
//         console.log('🔄 Creating Paystack popup instance...');

//         // Create new Paystack popup instance
//         const popup = new PaystackPop();

//         console.log('✅ Popup instance created');

//         // Open the popup by resuming the transaction
//         popup.resumeTransaction(accessCode, {
//           onCancel: () => {
//             console.log('⚠️ User closed Paystack popup');
//             reject(new Error('Payment cancelled by user'));
//           },
//           onSuccess: (transaction: any) => {
//             console.log('✅ Payment successful');
//             console.log('   Reference:', transaction.reference);
//             resolve(transaction.reference);
//           },
//         });

//         console.log('✅ Popup opened, waiting for payment...');
//       } catch (error) {
//         console.error('❌ Error opening Paystack popup:', error);
//         reject(error);
//       }
//     });
//   }
// }

import { Injectable, signal } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// Import Paystack from NPM package
import PaystackPop from '@paystack/inline-js';

export interface PaystackCheckoutRequest {
  organizationId: string;
  creditAmount: number;
  amountZAR: number;
}

export interface PaystackCheckoutResponse {
  success: boolean;
  accessCode?: string;
  authorizationUrl?: string;
  error?: string;
}

export interface PaystackVerificationResponse {
  success: boolean;
  data?: {
    reference: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    paidAt: string;
    customer: {
      email: string;
    };
  };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class PaystackService {
  private readonly initializeFunctionUrl =
    'https://hsilpedhzelahseceats.supabase.co/functions/v1/paystack-initialize';
  private readonly verifyFunctionUrl =
    'https://hsilpedhzelahseceats.supabase.co/functions/v1/paystack-verify';

  isInitializing = signal(false);
  initError = signal<string | null>(null);

  constructor(private supabase: SharedSupabaseService) {
    console.log('✅ PaystackService initialized with NPM package');
    console.log('   PaystackPop available:', typeof PaystackPop);
  }

  /**
   * Initialize Paystack transaction
   * Returns access code needed for Paystack Popup
   */
  async initializeTransaction(
    request: PaystackCheckoutRequest
  ): Promise<PaystackCheckoutResponse> {
    try {
      this.isInitializing.set(true);
      this.initError.set(null);

      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();

      const response = await fetch(this.initializeFunctionUrl, {
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
        const errorMsg = error.error || 'Failed to initialize payment';
        this.initError.set(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const data = await response.json();
      this.isInitializing.set(false);

      console.log('✅ Payment initialized with access code:', data.accessCode);

      return {
        success: true,
        accessCode: data.accessCode,
        authorizationUrl: data.authorizationUrl,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.initError.set(errorMsg);
      this.isInitializing.set(false);
      console.error('❌ Paystack init error:', error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Verify payment after Paystack Popup closes
   * Called from success callback with transaction reference
   */
  async verifyPayment(
    reference: string
  ): Promise<PaystackVerificationResponse> {
    try {
      const {
        data: { session },
      } = await this.supabase.client.auth.getSession();

      const response = await fetch(
        `${this.verifyFunctionUrl}?reference=${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.access_token || ''}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Verification failed',
        };
      }

      const data = await response.json();
      return {
        success: data.status === 'success',
        data: data.data,
        error: data.error,
      };
    } catch (error) {
      console.error('❌ Paystack verify error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification error',
      };
    }
  }

  /**
   * Open Paystack Popup with access code using NPM package
   * No CDN, no timing issues
   * Returns promise that resolves with reference on success
   */
  async openPaystackPopup(accessCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Creating Paystack popup instance...');

        // Create new Paystack popup instance
        const popup = new PaystackPop();

        console.log('✅ Popup instance created');

        // Open the popup by resuming the transaction
        popup.resumeTransaction(accessCode, {
          onCancel: () => {
            console.log('⚠️ User closed Paystack popup');
            reject(new Error('Payment cancelled by user'));
          },
          onSuccess: (transaction: any) => {
            console.log('✅ Payment successful');
            console.log('   Reference:', transaction.reference);
            resolve(transaction.reference);
          },
        });

        console.log('✅ Popup opened, waiting for payment...');
      } catch (error) {
        console.error('❌ Error opening Paystack popup:', error);
        reject(error);
      }
    });
  }
}
