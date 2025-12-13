// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// import Stripe from 'https://esm.sh/stripe@13.10.0';
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
// const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
// const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// const ZOHO_INVOICE_FUNCTION_URL = Deno.env.get('ZOHO_INVOICE_FUNCTION_URL');

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// const stripe = new Stripe(STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', {
//       headers: corsHeaders,
//     });
//   }

//   try {
//     if (req.method !== 'POST') {
//       return new Response(
//         JSON.stringify({
//           error: 'Method not allowed',
//         }),
//         {
//           status: 405,
//           headers: {
//             ...corsHeaders,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//     }

//     const signature = req.headers.get('stripe-signature');
//     if (!signature) {
//       console.error('❌ No stripe-signature header');
//       return new Response(
//         JSON.stringify({
//           error: 'No signature header',
//         }),
//         {
//           status: 400,
//           headers: {
//             ...corsHeaders,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//     }

//     const body = await req.text();
//     const event = await stripe.webhooks.constructEventAsync(
//       body,
//       signature,
//       STRIPE_WEBHOOK_SECRET
//     );

//     console.log('📨 Webhook event received:', event.type);

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;

//       console.log('💳 Checkout session:', {
//         id: session.id,
//         payment_status: session.payment_status,
//         metadata: session.metadata,
//       });

//       if (session.payment_status === 'paid' && session.metadata) {
//         const { organizationId, creditAmount, amountZAR } = session.metadata;

//         if (!organizationId || !creditAmount) {
//           console.error('❌ Missing metadata:', { organizationId, creditAmount });
//           return new Response(
//             JSON.stringify({
//               error: 'Missing required metadata',
//             }),
//             {
//               status: 400,
//               headers: {
//                 ...corsHeaders,
//                 'Content-Type': 'application/json',
//               },
//             }
//           );
//         }

//         console.log('✅ Processing payment for org:', {
//           organizationId,
//           creditAmount,
//           amountZAR,
//           sessionId: session.id,
//         });

//         const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

//         // Step 1: Add credits to organization
//         const { error, data } = await supabase.rpc('add_org_credits', {
//           p_org_id: organizationId,
//           p_amount: parseInt(creditAmount),
//           p_description: `Stripe payment - Session ${session.id}`,
//           p_user_id: null,
//         });

//         if (error) {
//           console.error('❌ RPC error:', error);
//           throw new Error(`Failed to add credits: ${error.message}`);
//         }

//         console.log('✅ Credits added successfully:', {
//           organizationId,
//           creditAmount,
//           sessionId: session.id,
//           timestamp: new Date().toISOString(),
//         });

//         // Step 2: Create Zoho invoice
//         if (ZOHO_INVOICE_FUNCTION_URL) {
//           try {
//             console.log('🎯 Calling Zoho invoice function...');

//             const zohoResponse = await fetch(ZOHO_INVOICE_FUNCTION_URL, {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//               },
//               body: JSON.stringify({
//                 organizationId,
//                 stripeSessionId: session.id,
//                 creditAmount: parseInt(creditAmount),
//                 amountZAR: parseFloat(amountZAR || '0'),
//               }),
//             });

//             if (!zohoResponse.ok) {
//               const zohoError = await zohoResponse.json();
//               console.error('⚠️ Zoho invoice creation failed:', zohoError);
//               // Don't throw - credits are already added, invoice can be retried
//             } else {
//               const zohoData = await zohoResponse.json();
//               console.log('✅ Zoho invoice created successfully:', {
//                 invoiceId: zohoData.invoiceId,
//                 invoiceNumber: zohoData.invoiceNumber,
//               });
//             }
//           } catch (zohoError) {
//             console.error('⚠️ Zoho integration error:', zohoError);
//             // Don't throw - credits are already added
//           }
//         } else {
//           console.warn('⚠️ ZOHO_INVOICE_FUNCTION_URL not configured');
//         }
//       } else {
//         console.warn('⚠️ Payment not completed or no metadata:', {
//           payment_status: session.payment_status,
//           hasMetadata: !!session.metadata,
//         });
//       }
//     } else {
//       console.log(`ℹ️ Unhandled event type: ${event.type}`);
//     }

//     return new Response(
//       JSON.stringify({
//         received: true,
//       }),
//       {
//         status: 200,
//         headers: {
//           ...corsHeaders,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//   } catch (error) {
//     console.error('❌ Webhook error:', error);
//     return new Response(
//       JSON.stringify({
//         error: error.message || 'Failed to process webhook',
//         success: false,
//       }),
//       {
//         status: 400,
//         headers: {
//           ...corsHeaders,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//   }
// });
