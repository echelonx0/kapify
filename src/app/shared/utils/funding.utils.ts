export type FundingType =
  | 'debt'
  | 'equity'
  | 'convertible'
  | 'mezzanine'
  | 'grant'
  | 'purchase_order'
  | 'invoice_financing';

export function formatFundingType(fundingType: FundingType | FundingType[] | undefined): string {
  if (!fundingType || (Array.isArray(fundingType) && fundingType.length === 0)) return 'Unknown';
  if (Array.isArray(fundingType)) {
    return fundingType.map(type => type.replace('_', ' ')).join(', ');
  }
  return fundingType.replace('_', ' ');
}

export function firstFundingType(fundingType: FundingType | FundingType[] | undefined): FundingType | undefined {
  return Array.isArray(fundingType) ? fundingType[0] : fundingType;
}


export function hasFundingType(
  fundingType: FundingType | FundingType[] | undefined,
  type: FundingType
): boolean {
  return Array.isArray(fundingType) ? fundingType.includes(type) : fundingType === type;
}
