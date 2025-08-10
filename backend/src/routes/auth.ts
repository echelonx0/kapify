// backend/src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['sme', 'funder']),
  companyName: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'Must agree to terms')
});

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required')
});

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          userType: validatedData.userType,
          status: 'active',
          emailVerified: false,
          phoneVerified: false,
          accountTier: 'basic'
        }
      });

      // Create basic profile
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: `${validatedData.firstName} ${validatedData.lastName}`,
          profileStep: 0,
          completionPercentage: 0
        }
      });

      // Create organization if provided
      let organization = null;
      if (validatedData.companyName) {
        organization = await tx.organization.create({
          data: {
            name: validatedData.companyName,
            type: validatedData.userType === 'sme' ? 'sme' : 'funder',
            status: 'active'
          }
        });

        // Link user to organization
        await tx.organizationUser.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'owner',
            permissions: JSON.stringify(validatedData.userType === 'sme' ? {
              canEditProfile: true,
              canViewProfile: true,
              canCreateApplications: true,
              canViewApplications: true,
              canEditApplications: true,
              canSubmitApplications: true,
              canUploadDocuments: true,
              canViewDocuments: true,
              canViewFinancials: true,
              canEditFinancials: true,
              canManageUsers: true,
              canViewReports: true
            } : {
              canViewApplications: true,
              canReviewApplications: true,
              canApproveApplications: true,
              canCreateOpportunities: true,
              canEditOpportunities: true,
              canViewReports: true,
              canManageUsers: true,
              canManageOrganizationSettings: true
            })
          }
        });
      }

      return { user, profile, organization };
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = result.user;

    return res.status(201).json({
      user: userWithoutPassword,
      profile: result.profile,
      organization: result.organization,
      accessToken,
      refreshToken
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        organizationUsers: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token (cleanup old ones first)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(storedToken.userId);

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;

    // Remove refresh token from database
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Remove all refresh tokens for this user (logout from all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id }
    });

    return res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        organizationUsers: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user data' });
  }
});

export default router;