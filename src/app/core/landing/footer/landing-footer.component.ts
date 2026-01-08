// src/app/shared/components/landing-footer.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
} from 'lucide-angular';

@Component({
  selector: 'landing-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing-footer.component.html',

  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
      }

      .animation-delay-100 {
        animation-delay: 0.1s;
      }

      .animation-delay-200 {
        animation-delay: 0.2s;
      }

      .animation-delay-300 {
        animation-delay: 0.3s;
      }

      .animation-delay-400 {
        animation-delay: 0.4s;
      }

      /* Smooth hover transitions */
      a,
      button {
        transition: all 0.2s ease;
      }
    `,
  ],
})
export class LandingFooterComponent {
  PhoneIcon = Phone;
  MailIcon = Mail;
  MapPinIcon = MapPin;
  ArrowRightIcon = ArrowRight;
  LinkedinIcon = Linkedin;
  TwitterIcon = Twitter;
  FacebookIcon = Facebook;
  InstagramIcon = Instagram;

  email = 'info@kapify.co.za';

  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  openFunderPortal() {
    this.router.navigate(['/register'], {
      queryParams: { userType: 'funder' },
    });
  }
}
