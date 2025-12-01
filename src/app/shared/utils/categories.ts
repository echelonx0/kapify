// src/app/shared/utils/categories.ts

// =============================
// INDUSTRY SECTORS
// =============================
export const INDUSTRY_SECTORS = [
  'Agriculture - Primary',
  'Agriculture - Secondary',
  'Automotive',
  'Professional & Technical Services',
  'Education',
  'Energy',
  'Engineering & Construction',
  'Financial Services',
  'Franchise',
  'Healthcare & Biotechnology',
  'Hospitality',
  'Information & Communication Technology',
  'Manufacturing',
  'Mining',
  'Real Estate',
  'Retail & Wholesale',
  'Tourism',
  'Transportation and Logistics',
  'Waste Management',
];

// =============================
// FUNDING OPTIONS
// =============================
export const FUNDING_OPTIONS = [
  'Equity Investment',
  'Debt Financing',
  'Convertible Notes',
  'Venture Capital',
  'Angel Investment',
  'Crowdfunding',
  'Purchase Order Funding',
  'Invoice Financing',
  'Grant Funding',
];

// =============================
// INVESTMENT RANGE (display inline)
// =============================
export interface InvestmentRange {
  typicalInvestment: string;
  minInvestment: string;
  maxInvestment: string;
}

export const DEFAULT_INVESTMENT_RANGES: InvestmentRange[] = [
  {
    typicalInvestment: '$250,000',
    minInvestment: '$100,000',
    maxInvestment: '$1,000,000',
  },
  {
    typicalInvestment: '$500,000',
    minInvestment: '$200,000',
    maxInvestment: '$2,000,000',
  },
];

// =============================
// INVESTMENT CRITERIA
// =============================
export const INVESTMENT_CRITERIA_FIELDS = [
  'Minimum 2 years of operational history',
  'Demonstrated product-market fit',
  'Strong and experienced founding team',
  'Clear revenue model or growth strategy',
  'Registered business with verifiable documentation',
  'Open to regular reporting and governance requirements',
];

// =============================
// EXCLUDED SECTORS
// =============================
export const EXCLUDED_SECTORS = [
  'Arms and Ammunition Manufacturing',
  'Tobacco Production',
  'Adult Entertainment',
  'Gambling and Betting',
  'Unregulated Crypto Assets',
  'Political or Religious Organizations',
];

// =============================
// STARTUP TERM DEFINITIONS (with tooltips)
// =============================
export const STARTUP_TERM_TOOLTIPS: Record<string, string> = {
  'Equity Investment':
    'Investor receives ownership shares in exchange for capital.',
  'Debt Financing':
    'Funds are borrowed and repaid with interest, without giving up ownership.',
  'Convertible Notes':
    'A loan that converts into equity at a later funding round.',
  'Venture Capital':
    'Equity investment from professional firms focused on high-growth startups.',
  'Angel Investment':
    'Capital provided by individual investors in exchange for equity.',
  Crowdfunding:
    'Funds raised from many small investors, often via online platforms.',
  'Purchase Order Funding':
    'Short-term finance to fulfill a confirmed purchase order.',
  'Invoice Financing':
    'Advance payment on unpaid invoices to improve cash flow.',
  'Grant Funding':
    'Non-repayable funds provided by institutions, governments, or foundations.',
  'Typical Investment':
    'The average investment amount commonly made by investors in this category.',
  'Min Investment': 'The minimum capital amount required to participate.',
  'Max Investment': 'The maximum capital amount an investor may contribute.',
  'Investment Criteria':
    'Conditions a business must meet to qualify for funding.',
  'Excluded Sectors': 'Industries that are not eligible for investment.',
};
