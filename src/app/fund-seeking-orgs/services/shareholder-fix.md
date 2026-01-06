// ============================================================================
// FIX: Shareholder Data Loss in Profile Transformer
// ============================================================================
// Problem: When reloading profile from backend, shareholders are lost
// Cause: transformCompanyInfo() hardcodes ownership: []
// Solution: Pass existing companyInfo and preserve ownership
// ============================================================================

// STEP 1: Update transformToFundingProfile in ProfileDataTransformerService
// ============================================================================

transformToFundingProfile(
profileData: Partial<ProfileData>,
existingCompanyInfo?: any // ← NEW parameter
): FundingApplicationProfile {
const result = {
// Pass existing company info to preserve ownership
companyInfo: this.transformCompanyInfo(
profileData.businessInfo,
profileData.personalInfo,
existingCompanyInfo // ← NEW
),
// ... rest of fields ...
};
return result;
}

// ============================================================================
// STEP 2: Update transformCompanyInfo to preserve ownership
// ============================================================================

private transformCompanyInfo(
businessInfo?: ProfileData['businessInfo'],
personalInfo?: ProfileData['personalInfo'],
existingCompanyInfo?: any // ← NEW parameter
) {
if (!businessInfo) return undefined;

return {
companyName: businessInfo.companyName || '',
registrationNumber: businessInfo.registrationNumber || '',
vatNumber: businessInfo.vatNumber,
industryType: businessInfo.industry || '',
businessActivity: businessInfo.businessDescription || '',
foundingYear:
new Date().getFullYear() - (businessInfo.yearsInOperation || 0),
operationalYears: businessInfo.yearsInOperation || 0,
companyType: 'pty_ltd' as const,
// ✅ FIX: Preserve ownership from existing (backend reload) or empty (new)
ownership: existingCompanyInfo?.ownership || [],
employeeCount: businessInfo.numberOfEmployees || '',
businessPhone: businessInfo.businessPhone || '',
// ... rest of fields unchanged ...
};
}

// ============================================================================
// STEP 3: Update transformFromFundingProfile to call with existing data
// ============================================================================

transformFromFundingProfile(
fundingProfile: FundingApplicationProfile
): Partial<ProfileData> {
// Preserve original companyInfo when transforming back
const result = {
businessInfo: this.extractBusinessInfo(fundingProfile.companyInfo),
personalInfo: this.extractPersonalInfo(fundingProfile.companyInfo),
// ... other fields ...
};

return result;
}

// ============================================================================
// STEP 4: Update FundingProfileSetupService to pass ownership on reload
// ============================================================================

// In loadExistingData():
private loadExistingData() {
const existingData = this.fundingApplicationService.data().companyInfo;
if (existingData) {
this.populateAdminForm(existingData);
this.loadShareholderData(existingData);

    // ✅ NEW: Store for transformer to preserve ownership
    this.cachedCompanyInfo = existingData;

}
}

// Add property to store:
private cachedCompanyInfo: any = null;

// When calling transformer (in any save operation):
const fundingData = this.transformer.transformToFundingProfile(
profileData,
this.cachedCompanyInfo // ← Pass existing company info
);

// ============================================================================
// VERIFICATION
// ============================================================================
// After fix, shareholders should:
// 1. Save when user adds them (already works) ✓
// 2. Load from backend with ownership array intact ✓
// 3. Not be lost when reloading profile ✓
// 4. Be available in applicationData.companyInfo.ownership ✓
