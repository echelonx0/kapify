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
    registeredAddress?: Address;
    operationalAddress?: Address;
  };
}

export interface Address {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}
