// backend/src/routes/funding-applications.ts - FIXED JSON DATA HANDLING
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas for funding application sections
const companyInfoSchema = z.object({
  companyName: z.string().min(1),
  registrationNumber: z.string().min(1),
  vatNumber: z.string().optional(),
  industryType: z.string().min(1),
  businessActivity: z.string().min(1),
  foundingYear: z.number().min(1800).max(new Date().getFullYear()),
  operationalYears: z.number().min(0),
  companyType: z.enum(['pty_ltd', 'close_corporation', 'sole_proprietor', 'partnership', 'npo']),
  employeeCount: z.string(),
  registeredAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  operationalAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  contactPerson: z.object({
    fullName: z.string(),
    position: z.string(),
    email: z.string().email(),
    phone: z.string()
  })
});

const businessAssessmentSchema = z.object({
  businessModel: z.string().min(10),
  valueProposition: z.string().min(10),
  targetMarkets: z.array(z.string()),
  customerSegments: z.string().min(10),
  marketSize: z.string().optional(),
  competitivePosition: z.string().optional(),
  operationalCapacity: z.string().optional(),
  supplyChain: z.string().optional()
});

const swotAnalysisSchema = z.object({
  strengths: z.array(z.string()).min(2),
  weaknesses: z.array(z.string()).min(2),
  opportunities: z.array(z.string()).min(2),
  threats: z.array(z.string()).min(2),
  strategicPriorities: z.array(z.string()).optional(),
  riskMitigation: z.array(z.string()).optional()
});

const managementStructureSchema = z.object({
  executiveTeam: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    position: z.string(),
    qualifications: z.string(),
    experience: z.number()
  })).optional(),
  managementTeam: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    role: z.string(),
    qualification: z.string(),
    yearsOfExperience: z.number()
  })).optional(),
  boardOfDirectors: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    role: z.string(),
    independent: z.boolean(),
    appointmentDate: z.string()
  })).optional()
});

const businessStrategySchema = z.object({
  executiveSummary: z.string().min(50),
  missionStatement: z.string().min(10),
  visionStatement: z.string().optional(),
  strategicObjectives: z.array(z.string()).optional(),
  marketAnalysis: z.string().optional(),
  competitiveStrategy: z.string().optional(),
  fundingRequirements: z.object({
    totalAmountRequired: z.number().positive(),
    currency: z.string().default('ZAR'),
    fundingType: z.enum(['loan', 'grant', 'equity', 'convertible', 'revenue_share']),
    fundingPurpose: z.string().min(10),
    timeline: z.string()
  })
});

const financialProfileSchema = z.object({
  monthlyRevenue: z.number().min(0),
  monthlyCosts: z.number().min(0),
  cashFlow: z.number(),
  currentAssets: z.number().min(0),
  currentLiabilities: z.number().min(0),
  netWorth: z.number(),
  historicalFinancials: z.array(z.object({
    year: z.number(),
    revenue: z.number(),
    grossProfit: z.number(),
    netProfit: z.number()
  })).optional(),
  projectedRevenue: z.array(z.object({
    year: z.number(),
    optimistic: z.number(),
    realistic: z.number(),
    pessimistic: z.number()
  })).optional()
});

// Section validation mapping
const sectionValidators: Record<string, z.ZodSchema> = {
  'company-info': companyInfoSchema,
  'business-assessment': businessAssessmentSchema,
  'swot-analysis': swotAnalysisSchema,
  'management': managementStructureSchema,
  'business-strategy': businessStrategySchema,
  'financial-profile': financialProfileSchema,
  'documents': z.record(z.any()) // Documents are handled separately
};

// GET /api/users/:id/funding-application - Load complete funding application
router.get('/:id/funding-application', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own application
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sections = await prisma.businessPlanSection.findMany({
      where: { userId: id },
      orderBy: { updatedAt: 'desc' }
    });

    const overallCompletion = sections.length > 0 
      ? Math.round(sections.reduce((sum, section) => sum + section.completionPercentage, 0) / sections.length)
      : 0;

    const response = {
      sections: sections.map(section => ({
        sectionType: section.sectionType,
        // FIX: Parse the JSON string back to object
        data: typeof section.data === 'string' ? JSON.parse(section.data) : section.data,
        completed: section.completed,
        completionPercentage: section.completionPercentage,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString()
      })),
      overallCompletion,
      lastUpdated: sections.length > 0 ? sections[0].updatedAt.toISOString() : new Date().toISOString()
    };

    return res.json(response);

  } catch (error) {
    console.error('Load funding application error:', error);
    return res.status(500).json({ error: 'Failed to load funding application' });
  }
});

// PATCH /api/users/:id/funding-application/:sectionType - Save individual section
router.patch('/:id/funding-application/:sectionType', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, sectionType } = req.params;
    const { data, completed = false, completion_percentage } = req.body;
    
    // Users can only update their own application
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate section type
    if (!sectionValidators[sectionType]) {
      return res.status(400).json({ error: 'Invalid section type' });
    }

    // Validate data if completed
    if (completed && sectionType !== 'documents') {
      try {
        sectionValidators[sectionType].parse(data);
      } catch (validationError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationError 
        });
      }
    }

    // Calculate completion percentage
    const calculatedCompletion = completion_percentage || calculateSectionCompletion(data, completed);

    // FIX: Convert data object to JSON string for SQLite
    const dataAsJsonString = JSON.stringify(data);

    console.log(`Saving section ${sectionType} for user ${id}:`, {
      sectionType,
      dataLength: dataAsJsonString.length,
      completed,
      calculatedCompletion
    });

    // Upsert section data
    const section = await prisma.businessPlanSection.upsert({
      where: {
        userId_sectionType: {
          userId: id,
          sectionType: sectionType
        }
      },
      update: {
        data: dataAsJsonString, // FIX: Store as JSON string
        completed,
        completionPercentage: calculatedCompletion,
        updatedAt: new Date()
      },
      create: {
        userId: id,
        sectionType: sectionType,
        data: dataAsJsonString, // FIX: Store as JSON string
        completed,
        completionPercentage: calculatedCompletion
      }
    });

    // Calculate overall completion
    const allSections = await prisma.businessPlanSection.findMany({
      where: { userId: id }
    });
    
    const overallCompletion = allSections.length > 0 
      ? Math.round(allSections.reduce((sum, s) => sum + s.completionPercentage, 0) / allSections.length)
      : 0;

    const response = {
      section: {
        sectionType: section.sectionType,
        // FIX: Parse JSON string back to object for response
        data: JSON.parse(section.data),
        completed: section.completed,
        completionPercentage: section.completionPercentage,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString()
      },
      overallCompletion,
      message: completed ? 'Section completed and saved' : 'Section draft saved',
      success: true
    };

    console.log(`✅ Section ${sectionType} saved successfully`);
    return res.json(response);

  } catch (error) {
    console.error('Save section error:', error);
    return res.status(500).json({ error: 'Failed to save section' });
  }
});

// POST /api/users/:id/funding-application/submit - Submit complete application for review
router.post('/:id/funding-application/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only submit their own application
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all sections
    const sections = await prisma.businessPlanSection.findMany({
      where: { userId: id }
    });

    // Check if all required sections are completed
    const requiredSections = ['company-info', 'business-assessment', 'swot-analysis', 'management', 'business-strategy', 'financial-profile'];
    const completedRequiredSections = sections.filter(section => 
      requiredSections.includes(section.sectionType) && section.completed
    );

    if (completedRequiredSections.length < requiredSections.length) {
      const missingSections = requiredSections.filter(required => 
        !completedRequiredSections.some(completed => completed.sectionType === required)
      );
      
      return res.status(400).json({ 
        error: 'Application incomplete', 
        missingSections,
        message: 'Please complete all required sections before submitting'
      });
    }

    // Create application record
    const applicationData = {
      sections: sections.reduce((acc, section) => {
        // FIX: Parse JSON string back to object
        acc[section.sectionType] = typeof section.data === 'string' ? JSON.parse(section.data) : section.data;
        return acc;
      }, {} as Record<string, any>)
    };

    // In a real implementation, you would create an Application record
    // For now, we'll simulate the submission
    const applicationId = `funding_app_${id}_${Date.now()}`;
    
    const response = {
      success: true,
      applicationId,
      submissionDate: new Date().toISOString(),
      status: 'submitted',
      message: 'Application submitted successfully for review'
    };

    console.log(`✅ Application ${applicationId} submitted for user ${id}`);

    // TODO: In production, create actual application record
    // await prisma.application.create({
    //   data: {
    //     id: applicationId,
    //     applicantId: id,
    //     title: 'SME Funding Application',
    //     description: 'Complete funding application profile',
    //     status: 'submitted',
    //     stage: 'initial_review',
    //     data: JSON.stringify(applicationData), // Store as JSON string
    //     submittedAt: new Date()
    //   }
    // });

    return res.json(response);

  } catch (error) {
    console.error('Submit application error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// DELETE /api/users/:id/funding-application - Clear all saved data
router.delete('/:id/funding-application', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only delete their own application
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.businessPlanSection.deleteMany({
      where: { userId: id }
    });

    console.log(`🗑️ Application data cleared for user ${id}`);
    return res.json({ success: true, message: 'Application data cleared successfully' });

  } catch (error) {
    console.error('Clear application error:', error);
    return res.status(500).json({ error: 'Failed to clear application data' });
  }
});

// GET /api/users/:id/funding-application/progress - Get application progress summary
router.get('/:id/funding-application/progress', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own progress
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sections = await prisma.businessPlanSection.findMany({
      where: { userId: id },
      select: {
        sectionType: true,
        completed: true,
        completionPercentage: true,
        updatedAt: true
      }
    });

    const requiredSections = ['company-info', 'business-assessment', 'swot-analysis', 'management', 'business-strategy', 'financial-profile'];
    const optionalSections = ['documents'];

    const progress = {
      overallCompletion: sections.length > 0 
        ? Math.round(sections.reduce((sum, s) => sum + s.completionPercentage, 0) / sections.length)
        : 0,
      completedSections: sections.filter(s => s.completed).length,
      totalSections: requiredSections.length + optionalSections.length,
      requiredCompleted: sections.filter(s => requiredSections.includes(s.sectionType) && s.completed).length,
      requiredTotal: requiredSections.length,
      isSubmissionReady: sections.filter(s => requiredSections.includes(s.sectionType) && s.completed).length >= requiredSections.length,
      sectionProgress: sections.reduce((acc, section) => {
        acc[section.sectionType] = {
          completed: section.completed,
          completionPercentage: section.completionPercentage,
          lastUpdated: section.updatedAt.toISOString()
        };
        return acc;
      }, {} as Record<string, any>),
      lastActivity: sections.length > 0 
        ? Math.max(...sections.map(s => s.updatedAt.getTime()))
        : null
    };

    return res.json(progress);

  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ error: 'Failed to get application progress' });
  }
});

// Helper functions
function calculateSectionCompletion(data: any, completed: boolean): number {
  if (completed) return 100;
  
  if (!data || typeof data !== 'object') return 0;
  
  const fields = Object.values(data);
  const filledFields = fields.filter(value => 
    value !== null && 
    value !== undefined && 
    value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;
  
  return fields.length > 0 ? Math.round((filledFields / fields.length) * 100) : 0;
}

export default router;