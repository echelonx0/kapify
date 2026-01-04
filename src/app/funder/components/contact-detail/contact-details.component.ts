import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-angular';

/**
 * Strongly typed contact details model
 */
export interface ContactDetails {
  company: {
    name?: string;
    phone?: string;
    industry?: string;
    companyType?: string;
    foundingYear?: number;
  };
  primaryContact: {
    fullName?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  addresses: {
    registeredAddress?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    operationalAddress?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

@Component({
  selector: 'app-contact-details-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.css'],
})
export class ContactDetailsModalComponent {
  @Input({ required: true }) contactDetails!: ContactDetails;
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();

  // Icons
  XIcon = X;
  BuildingIcon = Building2;
  UserIcon = User;
  PhoneIcon = Phone;
  MailIcon = Mail;
  MapPinIcon = MapPin;

  closeModal() {
    this.close.emit();
  }
}
