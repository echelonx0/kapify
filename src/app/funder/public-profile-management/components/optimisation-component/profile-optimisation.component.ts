// src/app/funder/components/profile-optimization-widget/profile-optimization-widget.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Sparkles, ExternalLink, Check, ArrowRight, Zap, Target, TrendingUp, Shield } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-profile-optimization-widget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, UiButtonComponent],
  templateUrl: 'profile-optimisation.component.html',
  styles: []
})
export class ProfileOptimizationWidgetComponent {
  private fb = inject(FormBuilder);

  // Icons
  SparklesIcon = Sparkles;
  ExternalLinkIcon = ExternalLink;
  CheckIcon = Check;
  ArrowRightIcon = ArrowRight;
  ZapIcon = Zap;
  TargetIcon = Target;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;

  // State
  isExpanded = signal(false);

  // Form
  optimizationForm = this.fb.group({
    website: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    additionalInfo: [''],
    email: ['', [Validators.required, Validators.email]]
  });

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
  }

  isFormValid(): boolean {
    return this.optimizationForm.valid;
  }

  subscribe() {
    if (!this.isFormValid()) return;

    const formData = this.optimizationForm.value;
    
    // Simulate subscription process
    console.log('Profile Optimization Subscription:', formData);
    
    // Show success message
    alert(`Thank you! We'll analyze ${formData.website} and have your optimized profile ready within 24 hours. Check your email for updates.`);
    
    // Reset form
    this.optimizationForm.reset();
    this.isExpanded.set(false);
  }
}