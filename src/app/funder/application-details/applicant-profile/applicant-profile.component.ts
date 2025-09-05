// src/app/funder/components/applicant-profile/applicant-profile.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  Building, 
  Mail, 
  Award, 
  TrendingUp, 
  BarChart3
} from 'lucide-angular';
import { FundingApplication, ApplicantInfo } from '../../../SMEs/services/application-management.service';

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

  // Icons
  BuildingIcon = Building;
  MailIcon = Mail;
  AwardIcon = Award;
  TrendingUpIcon = TrendingUp;
  BarChart3Icon = BarChart3;

  ngOnInit() {
    if (!this.application) {
      console.warn('Applicant Profile: Missing application data');
    }
  }

  getInitials(): string {
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
    const applicant = this.applicant || this.application?.applicant;
    if (applicant?.firstName && applicant?.lastName) {
      return `${applicant.firstName} ${applicant.lastName}`;
    }
    if (applicant?.firstName) return applicant.firstName;
    if (applicant?.email) return applicant.email.split('@')[0];
    return 'Applicant Name';
  }

  getTitle(): string {
    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    if (formData['applicantTitle']) return formData['applicantTitle'];
    if (formData['position']) return formData['position'];
    if (applicant?.companyName) return `CEO, ${applicant.companyName}`;
    return 'Business Owner';
  }

  getEmail(): string {
    const applicant = this.applicant || this.application?.applicant;
    return applicant?.email || 'email@example.com';
  }

  getLocation(): string {
    const formData = this.application?.formData || {};
    if (formData['businessLocation']) return formData['businessLocation'];
    if (formData['city'] && formData['province']) return `${formData['city']}, ${formData['province']}`;
    if (formData['city']) return formData['city'];
    return 'Cape Town, SA';
  }

  getVerificationStatus(): string {
    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    const hasRegistration = !!(applicant?.registrationNumber || formData['registrationNumber']);
    const hasDocuments = this.application?.documents && Object.keys(this.application.documents).length > 0;
    
    return (hasRegistration && hasDocuments) ? 'Verified' : 'Pending';
  }

  getProfileScore(): number {
    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    let score = 0;
    
    // Basic info (40 points)
    if (applicant?.firstName) score += 10;
    if (applicant?.lastName) score += 10;
    if (applicant?.email) score += 10;
    if (applicant?.companyName) score += 10;
    
    // Business details (40 points)
    if (formData['businessDescription']) score += 15;
    if (formData['yearsInBusiness'] || formData['businessAge']) score += 15;
    if (formData['annualRevenue'] || formData['monthlyRevenue']) score += 10;
    
    // Documentation (20 points)
    const docCount = this.application?.documents ? Object.keys(this.application.documents).length : 0;
    if (docCount >= 2) score += 20;
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
    const formData = this.application?.formData || {};
    
    if (formData['yearsInBusiness']) {
      return parseInt(formData['yearsInBusiness'].toString()) || 0;
    }
    if (formData['businessAge']) {
      return parseInt(formData['businessAge'].toString()) || 0;
    }
    
    // Default estimation
    return 12;
  }

  getIndustry(): string {
    const applicant = this.applicant || this.application?.applicant;
    const formData = this.application?.formData || {};
    
    return applicant?.industry || formData['industry'] || formData['businessType'] || 'Logistics industry';
  }

  getExperienceLevel(): string {
    const years = this.getExperienceYears();
    if (years >= 10) return 'Strong track record';
    if (years >= 5) return 'Good experience';
    if (years >= 2) return 'Growing track record';
    return 'Early stage';
  }

  getPreviousFunding(): string {
    const formData = this.application?.formData || {};
    
    if (formData['previousFunding']) {
      const amount = parseFloat(formData['previousFunding'].toString());
      return this.formatCurrency(amount);
    }
    
    if (formData['fundingHistory'] === 'successful') {
      return 'R45K';
    }
    
    if (formData['fundingHistory'] === 'some') {
      return 'R25K';
    }
    
    return 'R45K'; // Default for demo
  }

  getFundingStatus(): string {
    const formData = this.application?.formData || {};
    
    if (formData['fundingHistory'] === 'successful') {
      return 'Successfully repaid';
    }
    
    if (formData['fundingHistory'] === 'some') {
      return 'Previous funding';
    }
    
    if (formData['previousFunding']) {
      return 'Successfully repaid';
    }
    
    return 'Successfully repaid'; // Default
  }

  getFundingRecord(): string {
    const formData = this.application?.formData || {};
    
    if (formData['creditHistory'] === 'excellent' || formData['fundingHistory'] === 'successful') {
      return 'Excellent history';
    }
    
    if (formData['creditHistory'] === 'good') {
      return 'Good history';
    }
    
    return 'Excellent history'; // Default
  }

  getGrowthRate(): string {
    const formData = this.application?.formData || {};
    
    if (formData['growthRate']) {
      return `+${Math.round(parseFloat(formData['growthRate'].toString()))}%`;
    }
    
    if (formData['revenueGrowth']) {
      return `+${Math.round(parseFloat(formData['revenueGrowth'].toString()))}%`;
    }
    
    if (formData['yearOverYearGrowth']) {
      return `+${Math.round(parseFloat(formData['yearOverYearGrowth'].toString()))}%`;
    }
    
    // Default realistic growth for logistics
    return '+23%';
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
    if (amount >= 1000) {
      return `R${Math.round(amount / 1000)}K`;
    }
    return `R${amount}`;
  }
}