// backend/src/routes/users.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const profileUpdateSchema = z.object({
  userUpdates: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    profilePicture: z.string().optional()
  }).optional(),
  profileUpdates: z.object({
    displayName: z.string().optional(),
    bio: z.string().optional(),
    preferences: z.string().optional()
  }).optional(),
  organizationUpdates: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    website: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional()
  }).optional()
});

// GET /api/users/:id/profile - Get user profile data
router.get('/:id/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own profile (or admins can access any)
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
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

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const profileData = {
      user: userWithoutPassword,
      profile: user.profile,
      organizationUser: user.organizationUsers[0] || null,
      organization: user.organizationUsers[0]?.organization || null
    };

    return res.json(profileData);

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to get profile data' });
  }
});

// PATCH /api/users/:id/profile - Update user profile
router.patch('/:id/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only update their own profile
    if (req.user!.id !== id && req.user!.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validatedData = profileUpdateSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      let updatedUser = null;
      let updatedProfile = null;
      let updatedOrganization = null;

      // Update user data
      if (validatedData.userUpdates) {
        updatedUser = await tx.user.update({
          where: { id },
          data: validatedData.userUpdates,
          include: {
            profile: true,
            organizationUsers: {
              include: {
                organization: true
              }
            }
          }
        });
      }

      // Update profile data
      if (validatedData.profileUpdates) {
        updatedProfile = await tx.userProfile.upsert({
          where: { userId: id },
          update: validatedData.profileUpdates,
          create: {
            userId: id,
            ...validatedData.profileUpdates
          }
        });
      }

      // Update organization data (if user has one)
      if (validatedData.organizationUpdates) {
        const orgUser = await tx.organizationUser.findFirst({
          where: { userId: id },
          include: { organization: true }
        });

        if (orgUser) {
          updatedOrganization = await tx.organization.update({
            where: { id: orgUser.organizationId },
            data: validatedData.organizationUpdates
          });
        }
      }

      // Get complete updated data
      const completeUser = await tx.user.findUnique({
        where: { id },
        include: {
          profile: true,
          organizationUsers: {
            include: {
              organization: true
            }
          }
        }
      });

      return completeUser;
    });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result;

    const profileData = {
      user: userWithoutPassword,
      profile: result.profile,
      organizationUser: result.organizationUsers[0] || null,
      organization: result.organizationUsers[0]?.organization || null
    };

    return res.json(profileData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/:id/profile-picture - Upload profile picture
router.post('/:id/profile-picture', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only update their own profile picture
    if (req.user!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TODO: Implement file upload logic with multer
    // For now, just return a placeholder response
    return res.status(501).json({ error: 'Profile picture upload not implemented yet' });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    return res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

export default router;