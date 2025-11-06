# 🧾 Product Requirements Document (PRD) — Organization Credit System

## 📌 Summary

This document defines the **Organization Credit System** for our Angular + Supabase application.
Organizations will have a shared pool of credits that can be purchased and spent by authorized users.
Credits represent prepaid usage and can be consumed by various product features (e.g., API calls, premium tools).

---

## 🎯 Goals

1. **Centralized organization-level credits** (not per user).
2. **Plug-and-play integration** — any part of the app can “spend” credits easily.
3. **Secure and auditable** — every transaction is logged and traceable.
4. **Realtime updates** — credit balances update instantly across connected clients.
5. **Payment integration ready** — future integration with Stripe (via webhook or Edge Function).

---

## 🧩 Architecture Overview

| Layer    | Technology                           | Responsibility                |
| -------- | ------------------------------------ | ----------------------------- |
| Frontend | Angular                              | UI + service calls            |
| Backend  | Supabase (Postgres + RPC + Realtime) | Storage, logic, realtime sync |
| Auth     | Supabase Auth                        | Secure user context           |
| Payment  | (Future) Stripe / Payment provider   | Credit purchase triggers      |
| Storage  | Supabase Tables                      | Wallets & transaction history |

---

## 🧱 Database Schema (Postgres / Supabase)

### 1. `credits_wallets`

One wallet per **organization**.

```sql
create table if not exists public.credits_wallets (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint unique_wallet_per_org unique (organization_id)
);

create index if not exists idx_credits_wallets_org_id on credits_wallets (organization_id);
```

---

### 2. `credits_transactions`

Logs every purchase, spend, or adjustment event.

```sql
create table if not exists public.credits_transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid not null references credits_wallets(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  type text not null check (type in ('purchase', 'spend', 'adjustment', 'refund')),
  amount numeric(12,2) not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_credits_transactions_wallet_id on credits_transactions (wallet_id);
```

---

### 3. RPCs (Stored Procedures)

All credit modifications happen via RPC functions for atomic consistency.

#### `add_org_credits`

```sql
create or replace function add_org_credits(
  p_org_id uuid,
  p_amount numeric,
  p_description text,
  p_user_id uuid default null
)
returns void as $$
declare
  v_wallet_id uuid;
begin
  select id into v_wallet_id from credits_wallets where organization_id = p_org_id;

  if v_wallet_id is null then
    insert into credits_wallets (organization_id, balance)
    values (p_org_id, 0)
    returning id into v_wallet_id;
  end if;

  update credits_wallets
    set balance = balance + p_amount,
        updated_at = now()
    where id = v_wallet_id;

  insert into credits_transactions (wallet_id, user_id, type, amount, description)
  values (v_wallet_id, p_user_id, 'purchase', p_amount, p_description);
end;
$$ language plpgsql;
```

#### `spend_org_credits`

```sql
create or replace function spend_org_credits(
  p_org_id uuid,
  p_amount numeric,
  p_description text,
  p_user_id uuid default null
)
returns void as $$
declare
  v_wallet_id uuid;
  v_balance numeric;
begin
  select id, balance into v_wallet_id, v_balance
  from credits_wallets
  where organization_id = p_org_id
  for update;

  if v_wallet_id is null then
    raise exception 'Organization has no wallet';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient credits';
  end if;

  update credits_wallets
    set balance = balance - p_amount,
        updated_at = now()
    where id = v_wallet_id;

  insert into credits_transactions (wallet_id, user_id, type, amount, description)
  values (v_wallet_id, p_user_id, 'spend', -p_amount, p_description);
end;
$$ language plpgsql;
```

---

## 🔒 Row Level Security (RLS)

Restrict wallet and transaction visibility to organization members.

```sql
alter table credits_wallets enable row level security;
alter table credits_transactions enable row level security;

create policy "Org members can read their wallet"
  on credits_wallets
  for select using (
    exists (
      select 1 from organization_users ou
      where ou.user_id = auth.uid()
        and ou.organization_id = credits_wallets.organization_id
        and ou.is_active = true
    )
  );

create policy "Org members can read their transactions"
  on credits_transactions
  for select using (
    exists (
      select 1 from organization_users ou
      join credits_wallets w on w.id = credits_transactions.wallet_id
      where ou.user_id = auth.uid()
        and ou.organization_id = w.organization_id
        and ou.is_active = true
    )
  );
```

RPCs run as service role (no direct user updates allowed).

---

## 🔁 Realtime Updates

Enable realtime for wallets:

```sql
alter publication supabase_realtime add table public.credits_wallets;
```

Angular can subscribe for live updates:

```ts
this.supabase.client
  .channel(`org-wallet:${orgId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "credits_wallets",
      filter: `organization_id=eq.${orgId}`,
    },
    (payload) => {
      console.log("Wallet updated", payload.new);
    }
  )
  .subscribe();
```

---

## ⚙️ Angular Integration

### Service: `org-credit.service.ts`

Handles wallet creation, spending, purchasing, and querying.

```ts
@Injectable({ providedIn: 'root' })
export class OrgCreditService {
  constructor(private supabase: SharedSupabaseService) {}

  async getOrCreateOrgWallet(orgId: string): Promise<OrgWallet> { ... }

  getBalance(orgId: string): Promise<number> { ... }

  spendCredits(orgId: string, amount: number, description: string, userId?: string) { ... }

  addCredits(orgId: string, amount: number, description: string, userId?: string) { ... }

  getTransactions(orgId: string): Observable<OrgTransaction[]> { ... }
}
```

Example usage:

```ts
await this.orgCreditService.spendCredits(orgId, 10, "Generate Report", userId);
```

---

## 💰 Payment Flow (Future Integration)

1. Organization pays via payment provider (e.g., Stripe).

2. Webhook or Supabase Edge Function is called on successful payment.

3. The webhook executes:

   ```sql
   select add_org_credits(org_id, 100, 'Stripe purchase #1234', null);
   ```

4. The wallet balance updates instantly; frontend sees it via realtime subscription.

---

## 🧩 Example Feature Usage

Feature module (e.g., AI generation):

```ts
async runGeneration(orgId: string, cost = 5) {
  const userId = this.supabase.getCurrentUserId();

  try {
    await this.orgCreditService.spendCredits(orgId, cost, 'AI Generation', userId);
    console.log('✅ Credits deducted');
    // Proceed with operation
  } catch (e) {
    console.error('❌ Not enough credits');
    // Prompt top-up flow
  }
}
```

---

## 🚀 Future Enhancements

| Feature                        | Description                         |
| ------------------------------ | ----------------------------------- |
| **Stripe webhook integration** | Automate credit top-ups             |
| **Realtime transactions**      | Stream credit history updates       |
| **Credit expiration**          | Add optional `expires_at` column    |
| **Multi-tier pricing**         | Different rates per feature         |
| **Admin dashboard**            | Manage org wallets and transactions |

---

## 📋 Acceptance Criteria

- [ ] Each organization has exactly one wallet.
- [ ] Users can only access wallets of their organizations.
- [ ] Credits can be atomically added or spent.
- [ ] Every transaction is logged with org, user, and timestamp.
- [ ] Realtime updates reflect new balances immediately.
- [ ] RPCs are used — no direct table writes from the client.
- [ ] Secure with RLS and tested in multi-tenant context.

---

## 🧰 Dependencies

- Angular 17+
- Supabase JS SDK (`@supabase/supabase-js`)
- PostgreSQL 15+ (via Supabase)
- Supabase Realtime enabled
- SharedSupabaseService (existing)

---

## 💳 Stripe Webhook & Supabase Edge Function Integration

### 🧠 Purpose

This section defines how **payments through Stripe** (or another provider) trigger **credit top-ups** in the Supabase `credits_wallets` system.
The integration ensures:

- Reliable synchronization between successful Stripe payments and wallet updates.
- Prevention of double-crediting.
- Proper logging in `credits_transactions`.

---

## ⚙️ High-Level Flow

1. User (or admin) initiates a payment to purchase credits in the frontend.
2. Payment is completed through Stripe Checkout or PaymentIntent.
3. Stripe sends a webhook event (`checkout.session.completed` or `payment_intent.succeeded`) to Supabase Edge Function.
4. The Edge Function verifies the signature, extracts the `organization_id` and `credit_amount` from the event metadata, and calls the `add_org_credits()` RPC.
5. The wallet balance updates and triggers realtime updates to the organization clients.

---

## 🧱 Database Metadata Requirements

When creating a **Stripe Checkout Session**, the frontend must include the following in its metadata:

```json
{
  "organization_id": "uuid-of-org",
  "credit_amount": "100",
  "user_id": "uuid-of-user"
}
```

---

## 🧩 Supabase Edge Function: `stripe-webhook.ts`

Here’s a complete example using Deno for Supabase Edge Functions.

```ts
// supabase/functions/stripe-webhook/index.ts
import Stripe from "https://esm.sh/stripe@16.6.0";
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orgId = session.metadata.organization_id;
    const amount = parseFloat(session.metadata.credit_amount || "0");
    const userId = session.metadata.user_id;

    if (!orgId || !amount) {
      console.error("Missing orgId or amount in session metadata");
      return new Response("Missing metadata", { status: 400 });
    }

    // Call the RPC to add credits
    const { error } = await supabase.rpc("add_org_credits", {
      p_org_id: orgId,
      p_amount: amount,
      p_description: `Stripe payment ${session.id}`,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error adding org credits:", error);
      return new Response("Supabase RPC error", { status: 500 });
    }

    console.log(`✅ Added ${amount} credits to org ${orgId}`);
  }

  return new Response("ok", { status: 200 });
});
```

---

## 🧰 Environment Variables

| Variable                    | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `STRIPE_SECRET_KEY`         | Your Stripe secret API key                       |
| `STRIPE_WEBHOOK_SECRET`     | Webhook signing secret from Stripe Dashboard     |
| `SUPABASE_URL`              | Supabase project URL                             |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (required to call RPC securely) |

---

## 📦 Deployment

Deploy the Edge Function:

```bash
supabase functions deploy stripe-webhook --project-ref your-project-ref
```

Then set up a webhook in your Stripe Dashboard:

- **Event type**: `checkout.session.completed`
- **Endpoint URL**: `https://<your-project-ref>.functions.supabase.co/stripe-webhook`

---

## 🔐 Security

- Signature verification with `stripe.webhooks.constructEvent()` ensures authenticity.
- The RPC runs with a **service role key**, so users cannot spoof credit top-ups.
- Metadata validation ensures org IDs and credit amounts are explicit and controlled.
- Stripe webhook endpoints should be **private (not exposed to client)**.

---

## 🔁 Frontend Flow for Stripe Checkout

When the user wants to purchase credits:

```ts
async openCheckout(orgId: string, creditAmount: number, userId: string) {
  const response = await this.http.post<{ sessionId: string }>('/api/create-checkout-session', {
    organization_id: orgId,
    credit_amount: creditAmount,
    user_id: userId,
  });

  const stripe = await loadStripe(environment.stripePublicKey);
  await stripe?.redirectToCheckout({ sessionId: response.sessionId });
}
```

Backend endpoint `/api/create-checkout-session` (Node or Edge Function) creates the Stripe session with the metadata above.

---

## 🧾 Example Transaction Lifecycle

| Step | Action                  | Table / Function                        | Notes                                   |
| ---- | ----------------------- | --------------------------------------- | --------------------------------------- |
| 1    | User buys credits       | Stripe Checkout                         | Session created with org metadata       |
| 2    | Stripe payment succeeds | Stripe webhook → Supabase Edge Function | `checkout.session.completed` fired      |
| 3    | Supabase RPC executed   | `add_org_credits()`                     | Atomic wallet update                    |
| 4    | Transaction logged      | `credits_transactions`                  | Includes `purchase` entry               |
| 5    | Realtime update         | Supabase Realtime                       | Frontend reflects new balance instantly |

---

## 🧠 Error Handling & Idempotency

- The webhook should handle **duplicate events** gracefully.
  You can ensure idempotency by checking if a Stripe session ID already exists in `credits_transactions` (via metadata).
- Add an optional `stripe_session_id` column to `credits_transactions`:

```sql
alter table credits_transactions add column if not exists stripe_session_id text unique;
```

Then insert it during the RPC call or Edge Function.

---

## 📋 Acceptance Criteria (Payments)

- [ ] Credits are added to organization wallets when Stripe payment completes.
- [ ] No duplicate crediting on webhook retries.
- [ ] Webhook validates Stripe signature.
- [ ] Realtime updates reflect new balances.
- [ ] Transaction log includes Stripe session ID for audit trail.
- [ ] Secure isolation — no user can manually call credit top-up RPCs.
