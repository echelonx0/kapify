create table public.funding_opportunities (
id uuid not null default gen_random_uuid (),
fund_id uuid null,
organization_id uuid not null,
created_by uuid not null,
title character varying(255) not null,
description text not null,
short_description character varying(500) null,
target_company_profile text null,
offer_amount bigint not null,
min_investment bigint not null,
max_investment bigint not null,
currency character varying(3) not null default 'ZAR'::character varying,
interest_rate numeric(5, 2) null,
equity_offered numeric(5, 2) null,
repayment_terms text null,
security_required text null,
use_of_funds text null,
investment_structure text null,
expected_returns numeric(5, 2) null,
investment_horizon integer null,
exit_strategy text null,
application_deadline date null,
decision_timeframe integer not null default 30,
application_process jsonb null,
eligibility_criteria jsonb not null default '{}'::jsonb,
status character varying(20) null default 'draft'::character varying,
total_available bigint not null,
amount_committed bigint null default 0,
amount_deployed bigint null default 0,
max_applications integer null,
current_applications integer null default 0,
view_count integer null default 0,
application_count integer null default 0,
conversion_rate numeric(5, 2) null,
deal_lead uuid null,
deal_team jsonb null,
auto_match boolean null default true,
match_criteria jsonb null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
published_at timestamp with time zone null,
closed_at timestamp with time zone null,
funding_opportunity_image_url text null,
funding_opportunity_video_url text null,
funder_organization_name character varying(255) null,
funder_organization_logo_url text null,
investment_criteria jsonb null,
typical_investment bigint not null,
opportunity_funding_type text[] null default '{}'::text[],
funding_type text[] null default '{}'::text[],
exclusion_criteria text null,
constraint funding_opportunities_pkey primary key (id),
constraint fk_funding_opportunities_organization foreign KEY (organization_id) references organizations (id) on delete CASCADE,
constraint funding_opportunities_fund_id_fkey foreign KEY (fund_id) references funds (id) on delete CASCADE,
constraint funding_opportunities_deal_lead_fkey foreign KEY (deal_lead) references auth.users (id),
constraint funding_opportunities_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete CASCADE,
constraint funding_opportunities_application_deadline_check check ((application_deadline > CURRENT_DATE)),
constraint funding_opportunities_check check ((max_investment >= min_investment)),
constraint funding_opportunities_conversion_rate_check check (
(
(conversion_rate >= (0)::numeric)
and (conversion_rate <= (100)::numeric)
)
),
constraint funding_opportunities_current_applications_check check ((current_applications >= 0)),
constraint funding_opportunities_decision_timeframe_check check ((decision_timeframe > 0)),
constraint funding_opportunities_equity_offered_check check (
(
(equity_offered >= (0)::numeric)
and (equity_offered <= (100)::numeric)
)
),
constraint funding_opportunities_interest_rate_check check (
(
(interest_rate >= (0)::numeric)
and (interest_rate <= (100)::numeric)
)
),
constraint funding_opportunities_max_applications_check check ((max_applications > 0)),
constraint funding_opportunities_min_investment_check check ((min_investment > 0)),
constraint funding_opportunities_view_count_check check ((view_count >= 0)),
constraint valid_opportunity_currency check (
(
(currency)::text = any (
(
array[
'ZAR'::character varying,
'USD'::character varying,
'EUR'::character varying,
'GBP'::character varying
]
)::text[]
)
)
),
constraint check_amounts_logical check (
(
(amount_committed <= total_available)
and (amount_deployed <= amount_committed)
)
),
constraint valid_opportunity_status check (
(
(status)::text = any (
(
array[
'draft'::character varying,
'active'::character varying,
'paused'::character varying,
'closed'::character varying,
'fully_subscribed'::character varying
]
)::text[]
)
)
),
constraint check_applications_logical check (
(
current_applications <= COALESCE(max_applications, (current_applications + 1))
)
),
constraint funding_opportunities_amount_committed_check check ((amount_committed >= 0)),
constraint funding_opportunities_amount_deployed_check check ((amount_deployed >= 0)),
constraint funding_opportunities_application_count_check check ((application_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_organization_id on public.funding_opportunities using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_fund_id on public.funding_opportunities using btree (fund_id) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_created_by on public.funding_opportunities using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_status on public.funding_opportunities using btree (status) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_published_at on public.funding_opportunities using btree (published_at) TABLESPACE pg_default;

create index IF not exists idx_funding_opportunities_active_opportunities on public.funding_opportunities using btree (status, published_at) TABLESPACE pg_default
where
((status)::text = 'active'::text);

create index IF not exists idx_funding_opportunities_eligibility_gin on public.funding_opportunities using gin (eligibility_criteria) TABLESPACE pg_default;

create trigger update_fund_available_amount_trigger
after INSERT
or DELETE
or
update on funding_opportunities for EACH row
execute FUNCTION update_fund_available_amount ();

create trigger update_funding_opportunities_updated_at BEFORE
update on funding_opportunities for EACH row
execute FUNCTION update_updated_at_column ();
