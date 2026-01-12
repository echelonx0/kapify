/**
 * Demographics Configuration
 * PHASE 1: Hardcoded mock config (will be admin-managed in Phase 2)
 *
 * This defines all demographic categories and fields
 * that SMEs see when filling out their funding request
 */

import { DemographicCategory } from '../models/funding-application-demographics.model';

export const DEMOGRAPHICS_CONFIG: DemographicCategory[] = [
  {
    id: 'shareholding',
    label: 'Shareholding',
    description: 'Business ownership structure',
    order: 1,
    fields: [
      {
        name: 'blackOwnership',
        label: 'Black Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 45',
        min: 0,
        max: 100,
        helpText: 'Percentage of shareholding under Black Ownership',
      },
      {
        name: 'womanOwnership',
        label: 'Woman Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 60',
        min: 0,
        max: 100,
        helpText: 'Percentage of shareholding held by women',
      },
      {
        name: 'womenBlackOwnership',
        label: 'Black Woman Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 30',
        min: 0,
        max: 100,
        helpText: 'Percentage of shareholding held by Black women',
      },
      {
        name: 'youthOwnership',
        label: 'Youth Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 51',
        min: 0,
        max: 100,
        helpText: 'Percentage of shareholding held by youth (under 35)',
      },
      {
        name: 'youthBlackOwnership',
        label: 'Black Youth Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 40',
        min: 0,
        max: 100,
        helpText: 'Percentage of shareholding held by Black youth',
      },
      {
        name: 'disabilityOwnership',
        label: 'Disability Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 25',
        min: 0,
        max: 100,
        helpText:
          'Percentage of shareholding held by individuals with disability',
      },
      {
        name: 'disabilityBlackOwnership',
        label: 'Black Disability Ownership (%)',
        type: 'percentage',
        required: false,
        placeholder: 'e.g., 15',
        min: 0,
        max: 100,
        helpText:
          'Percentage of shareholding held by Black individuals with disability',
      },
    ],
  },
  {
    id: 'businessArea',
    label: 'Business Area',
    description: 'Where your business is located',
    order: 2,
    fields: [
      {
        name: 'area',
        label: 'Which area is the business registered in?',
        type: 'dropdown',
        required: false,
        options: ['Urban', 'Township', 'Rural'],
        helpText: 'Select the primary business location',
      },
    ],
  },
  {
    id: 'jobStats',
    label: 'Jobs Statistics',
    description: 'Employment impact metrics',
    order: 3,
    fields: [
      {
        name: 'jobsCreated',
        label: 'Jobs Created (last 12-24 months)',
        type: 'number',
        required: false,
        placeholder: 'e.g., 15',
        min: 0,
        helpText: 'Number of jobs created in the last 12-24 months',
      },
      {
        name: 'expectedJobs',
        label: 'Expected Jobs (next 12-36 months)',
        type: 'number',
        required: false,
        placeholder: 'e.g., 25',
        min: 0,
        helpText:
          'Number of jobs expected to be created in the next 12-36 months',
      },
    ],
  },
];

/**
 * Helper: Get category by ID
 */
export function getDemographicCategory(
  categoryId: string
): DemographicCategory | undefined {
  return DEMOGRAPHICS_CONFIG.find((cat) => cat.id === categoryId);
}

/**
 * Helper: Get all field names
 */
export function getAllDemographicFields(): string[] {
  return DEMOGRAPHICS_CONFIG.flatMap((cat) =>
    cat.fields.map((field) => `${cat.id}.${field.name}`)
  );
}

/**
 * Helper: Get field by category and field name
 */
export function getDemographicField(categoryId: string, fieldName: string) {
  const category = getDemographicCategory(categoryId);
  if (!category) return undefined;
  return category.fields.find((f) => f.name === fieldName);
}
