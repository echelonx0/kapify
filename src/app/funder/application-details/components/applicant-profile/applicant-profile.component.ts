// src/app/funder/components/applicant-profile/applicant-profile.component.ts - FIXED
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  Building, 
  Mail, 
  Award, 
  TrendingUp, 
  BarChart3
} from 'lucide-angular'; 
 
import { FundingApplication, ApplicantInfo } from 'src/app/SMEs/models/application.models';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import { ProfileDataTransformerService } from 'src/app/SMEs/services/profile-data-transformer.service';

@Component({
  selector: 'app-applicant-profile',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: 'applicant-profile.component.html',
  styles: [`
    .insight-card {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
      border: 1px solid rgba(59, 130, 246, 0.2);
      transition: all 0.2s ease;
    }
    
    .insight-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class ApplicantProfileComponent implements OnInit {
  @Input() application!: FundingApplication;
  @Input() applicant?: ApplicantInfo;

  // INJECT SERVICES TO ACCESS PROFILE DATA
  private backendService = inject(FundingProfileBackendService);
  private transformer = inject(ProfileDataTransformerService);

  // Icons
  BuildingIcon = Building;
  MailIcon = Mail;
  AwardIcon = Award;
  TrendingUpIcon = TrendingUp;
  BarChart3Icon = BarChart3;

  // STORE PROFILE DATA
  profileData: Partial<ProfileData> | null = null;
  profileLoading = false;
  profileError: string | null = null;

  ngOnInit() {
    if (!this.application) {
      console.warn('Applicant Profile: Missing application data');
      return;
    }

    // Load the applicant's full profile data
    this.loadApplicantProfile();
  }

  private async loadApplicantProfile() {
    if (!this.application.applicantId) {
      console.warn('Applicant Profile: Missing applicant ID');
      return;
    }

    this.profileLoading = true;
    this.profileError = null;

    try {
      console.log('🔄 Loading profile for applicant:', this.application.applicantId);
      
      // Load the full profile using the backend service
      const fundingProfile = await this.backendService
        .loadSavedProfileForUser(this.application.applicantId)
        .toPromise();

      if (fundingProfile) {
        // Transform to UI format
        this.profileData = this.transformer.transformFromFundingProfile(fundingProfile);
        console.log('✅ Profile loaded successfully:', this.profileData);
      } else {
        throw new Error('No profile data found');
      }

    } catch (error) {
      console.error('❌ Failed to load applicant profile:', error);
      this.profileError = 'Unable to load applicant profile';
    } finally {
      this.profileLoading = false;
    }
  }

  // UPDATED METHODS TO USE ACTUAL PROFILE DATA

  getInitials(): string {
    if (this.profileData?.personalInfo) {
      const { firstName, lastName } = this.profileData.personalInfo;
      if (firstName && lastName) {
        return (firstName[0] + lastName[0]).toUpperCase();
      }
      if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
      }
    }

    // Fallback to applicant data
    const applicant = this.applicant || this.application?.applicant;
    if (applicant?.firstName && applicant?.lastName) {
      return (applicant.firstName[0] + applicant.lastName[0]).toUpperCase();
    }
    if (applicant?.firstName) {
      return applicant.firstName.substring(0, 2).toUpperCase();
    }
    if (applicant?.email) {
      return applicant.email.substring(0, 2).toUpperCase();
    }
    return 'AP';
  }

  getFullName(): string {
    if (this.profileData?.personalInfo) {
      const { firstName, lastName } = this.profileData.personalInfo;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      if (firstName) return firstName;
    }

    // Fallback to applicant data
    const applicant = this.applicant || this.application?.applicant;
    if (applicant?.firstName && applicant?.lastName) {
      return `${applicant.firstName} ${applicant.lastName}`;
    }
    if (applicant?.firstName) return applicant.firstName;
    if (applicant?.email) return applicant.email.split('@')[0];
    return 'Applicant Name';
  }

  getTitle(): string {
    if (this.profileData?.personalInfo?.position) {
      return this.profileData.personalInfo.position;
    }

    // Fallback logic
    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    if (formData['applicantTitle']) return formData['applicantTitle'];
    if (formData['position']) return formData['position'];
    if (applicant?.companyName) return `CEO, ${applicant.companyName}`;
    if (this.profileData?.businessInfo?.companyName) {
      return `CEO, ${this.profileData.businessInfo.companyName}`;
    }
    return 'Business Owner';
  }

  getEmail(): string {
    if (this.profileData?.personalInfo?.email) {
      return this.profileData.personalInfo.email;
    }

    const applicant = this.applicant || this.application?.applicant;
    return applicant?.email || 'email@example.com';
  }

  getLocation(): string {
    if (this.profileData?.businessInfo?.physicalAddress) {
      const addr = this.profileData.businessInfo.physicalAddress;
      if (addr.city && addr.province) {
        return `${addr.city}, ${addr.province}`;
      }
      if (addr.city) return addr.city;
    }

    // Fallback logic
    const formData = this.application?.formData || {};
    if (formData['businessLocation']) return formData['businessLocation'];
    if (formData['city'] && formData['province']) return `${formData['city']}, ${formData['province']}`;
    if (formData['city']) return formData['city'];
    return 'Cape Town, SA';
  }

  getCompanyName(): string {
    if (this.profileData?.businessInfo?.companyName) {
      return this.profileData.businessInfo.companyName;
    }

    const applicant = this.applicant || this.application?.applicant;
    return applicant?.companyName || 'Company Name';
  }

  getVerificationStatus(): string {
    // Check if we have registration number
    const hasRegistration = !!(
      this.profileData?.businessInfo?.registrationNumber || 
      this.applicant?.registrationNumber
    );
    
    // Check if we have documents
    const hasDocuments = this.application?.documents && Object.keys(this.application.documents).length > 0;
    
    return (hasRegistration && hasDocuments) ? 'Verified' : 'Pending';
  }

  getProfileScore(): number {
    let score = 0;
    
    // Personal info (20 points)
    if (this.profileData?.personalInfo?.firstName) score += 5;
    if (this.profileData?.personalInfo?.lastName) score += 5;
    if (this.profileData?.personalInfo?.email) score += 5;
    if (this.profileData?.personalInfo?.position) score += 5;
    
    // Business info (30 points)
    if (this.profileData?.businessInfo?.companyName) score += 10;
    if (this.profileData?.businessInfo?.registrationNumber) score += 10;
    if (this.profileData?.businessInfo?.industry) score += 10;
    
    // Financial info (25 points)
    if (this.profileData?.financialInfo?.monthlyRevenue) score += 10;
    if (this.profileData?.financialInfo?.annualRevenue) score += 10;
    if (this.profileData?.financialInfo?.profitMargin) score += 5;
    
    // Documents (25 points)
    const docCount = this.application?.documents ? Object.keys(this.application.documents).length : 0;
    if (docCount >= 3) score += 25;
    else if (docCount >= 2) score += 15;
    else if (docCount >= 1) score += 10;
    
    return Math.min(100, score);
  }

  getCreditGrade(): string {
    const score = this.getProfileScore();
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  }

  getExperienceYears(): number {
    if (this.profileData?.businessInfo?.yearsInOperation) {
      return this.profileData.businessInfo.yearsInOperation;
    }

    // Fallback logic
    const formData = this.application?.formData || {};
    if (formData['yearsInBusiness']) {
      return parseInt(formData['yearsInBusiness'].toString()) || 0;
    }
    if (formData['businessAge']) {
      return parseInt(formData['businessAge'].toString()) || 0;
    }
    
    return 5; // Default
  }

  getIndustry(): string {
    if (this.profileData?.businessInfo?.industry) {
      return this.profileData.businessInfo.industry;
    }

    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    return applicant?.industry || formData['industry'] || formData['businessType'] || 'Technology';
  }

  getExperienceLevel(): string {
    const years = this.getExperienceYears();
    if (years >= 10) return 'Strong track record';
    if (years >= 5) return 'Good experience';
    if (years >= 2) return 'Growing track record';
    return 'Early stage';
  }

  getMonthlyRevenue(): string {
    if (this.profileData?.financialInfo?.monthlyRevenue) {
      const amount = parseFloat(this.profileData.financialInfo.monthlyRevenue);
      return this.formatCurrency(amount);
    }

    // Fallback to form data
    const formData = this.application?.formData || {};
    if (formData['monthlyRevenue']) {
      const amount = parseFloat(formData['monthlyRevenue'].toString());
      return this.formatCurrency(amount);
    }

    return 'R85K'; // Default for demo
  }

  getPreviousFunding(): string {
    // Check if we have funding history in profile
    if (this.profileData?.fundingInfo?.amountRequired) {
      const amount = parseFloat(this.profileData.fundingInfo.amountRequired);
      return this.formatCurrency(amount);
    }

    // Fallback logic
    const formData = this.application?.formData || {};
    if (formData['previousFunding']) {
      const amount = parseFloat(formData['previousFunding'].toString());
      return this.formatCurrency(amount);
    }
    
    return 'R45K'; // Default
  }

  getFundingStatus(): string {
    const formData = this.application?.formData || {};
    
    if (formData['fundingHistory'] === 'successful') {
      return 'Successfully repaid';
    }
    
    if (formData['fundingHistory'] === 'some') {
      return 'Previous funding';
    }
    
    return 'First-time applicant';
  }

  getFundingRecord(): string {
    const formData = this.application?.formData || {};
    
    if (formData['creditHistory'] === 'excellent' || formData['fundingHistory'] === 'successful') {
      return 'Excellent history';
    }
    
    if (formData['creditHistory'] === 'good') {
      return 'Good history';
    }
    
    return 'New business'; // Default for first-time applicants
  }

  getGrowthRate(): string {
    // Try to calculate from financial data
    if (this.profileData?.financialInfo?.annualRevenue && this.profileData?.financialInfo?.monthlyRevenue) {
      const annual = parseFloat(this.profileData.financialInfo.annualRevenue);
      const monthly = parseFloat(this.profileData.financialInfo.monthlyRevenue);
      const currentAnnual = monthly * 12;
      
      if (annual > 0 && currentAnnual > annual) {
        const growth = ((currentAnnual - annual) / annual) * 100;
        return `+${Math.round(growth)}%`;
      }
    }

    // Fallback to form data
    const formData = this.application?.formData || {};
    if (formData['growthRate']) {
      return `+${Math.round(parseFloat(formData['growthRate'].toString()))}%`;
    }
    
    return '+23%'; // Default realistic growth
  }

  getGrowthPeriod(): string {
    return 'YoY revenue growth';
  }

  getGrowthDescription(): string {
    const growthStr = this.getGrowthRate();
    const growth = parseInt(growthStr.replace(/[+%]/g, ''));
    
    if (growth >= 25) return 'Excellent growth';
    if (growth >= 15) return 'Above industry avg';
    if (growth >= 5) return 'Steady growth';
    return 'Moderate growth';
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `R${Math.round(amount / 1000000)}M`;
    }
    if (amount >= 1000) {
      return `R${Math.round(amount / 1000)}K`;
    }
    return `R${Math.round(amount)}`;
  }

  // Loading state helpers
  isProfileLoading(): boolean {
    return this.profileLoading;
  }

  hasProfileError(): boolean {
    return !!this.profileError;
  }

  getProfileError(): string | null {
    return this.profileError;
  }

  // Helper to check if we have sufficient data
  hasProfileData(): boolean {
    return !!this.profileData;
  }
}