// ============================================
// DATA ROOM MODELS
// ============================================

export interface DataRoom {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  isActive: boolean;
  visibility: 'private' | 'restricted' | 'public';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataRoomSection {
  id: string;
  dataRoomId: string;
  sectionKey: string;
  title: string;
  description?: string;
  displayOrder: number;
  isEnabled: boolean;
  icon?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataRoomDocument {
  id: string;
  dataRoomId: string;
  sectionId?: string;
  documentId?: string; // Reference to documents table
  externalUrl?: string;
  documentType: 'file' | 'link';
  category: string;
  title: string;
  description?: string;
  tags?: string[];
  isFeatured: boolean;
  displayOrder: number;
  isShareable: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed fields (not in DB)
  fileSize?: number;
  mimeType?: string;
  originalName?: string;
}

export interface DataRoomShare {
  id: string;
  dataRoomId: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  permissionLevel: 'view' | 'download' | 'full';
  allowedSections?: string[];
  accessReason?: string;
  internalNotes?: string;
  status: 'active' | 'revoked' | 'expired' | 'pending';
  sharedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  downloadCount: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Joined data
  sharedWithUser?: {
    id: string;
    email: string;
    name?: string;
    companyName?: string;
  };
  sharedDocumentIds?: string[];
}

export interface DataRoomShareDocument {
  id: string;
  shareId: string;
  documentId: string;
  createdAt: Date;
}

export interface DataRoomAccessRequest {
  id: string;
  dataRoomId: string;
  requesterId: string;
  requestReason: string;
  requestedSections?: string[];
  organizationName?: string;
  contactEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  reviewedByUserId?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  shareId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Joined data
  requester?: {
    id: string;
    email: string;
    name?: string;
  };
  dataRoom?: {
    id: string;
    title: string;
    organizationName?: string;
  };
}

export interface DataRoomAccessLog {
  id: string;
  dataRoomId: string;
  userId: string;
  shareId?: string;
  actionType: 'view' | 'download' | 'export' | 'share' | 'request_access';
  sectionKey?: string;
  documentId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionDuration?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  
  // Joined data
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  document?: {
    id: string;
    title: string;
  };
}

// ============================================
// VIEW MODELS & DTOs
// ============================================

export interface DataRoomView {
  dataRoom: DataRoom;
  sections: DataRoomSection[];
  documents: DataRoomDocument[];
  viewerContext: ViewerContext;
  permissions: UserPermissions;
}

export interface ViewerContext {
  userId: string;
  userType: 'owner' | 'viewer';
  shareId?: string;
  permissionLevel?: 'view' | 'download' | 'full';
  allowedSections?: string[];
  allowedDocumentIds?: string[];
}

export interface UserPermissions {
  canView: boolean;
  canDownload: boolean;
  canManage: boolean;
  canShare: boolean;
  canExport: boolean;
  accessibleSections: string[];
  accessibleDocumentIds: string[];
}

export interface AccessStatus {
  hasAccess: boolean;
  shareId?: string;
  permissionLevel?: 'view' | 'download' | 'full';
  expiresAt?: Date;
  pendingRequestId?: string;
}

export interface AccessSummary {
  totalViews: number;
  totalDownloads: number;
  uniqueViewers: number;
  recentActivity: DataRoomAccessLog[];
  topDocuments: DocumentAccessStats[];
}

export interface DocumentAccessStats {
  documentId: string;
  documentTitle: string;
  viewCount: number;
  downloadCount: number;
  lastAccessed: Date;
}

export interface UserAccessSummary {
  userId: string;
  userName?: string;
  userEmail: string;
  viewCount: number;
  downloadCount: number;
  lastAccess: Date;
}

// ============================================
// REQUEST/RESPONSE DTOs
// ============================================

export interface CreateDataRoomDocumentRequest {
  dataRoomId: string;
  sectionId?: string;
  documentType: 'file' | 'link';
  file?: File; // For file uploads
  externalUrl?: string; // For links
  category: string;
  title: string;
  description?: string;
  tags?: string[];
  isFeatured?: boolean;
  isShareable?: boolean;
}

export interface UpdateDataRoomDocumentRequest {
  documentId: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isFeatured?: boolean;
  isShareable?: boolean;
  displayOrder?: number;
  file?: File; // For replacing file
}

export interface CreateShareRequest {
  dataRoomId: string;
  sharedWithUserId: string;
  permissionLevel: 'view' | 'download';
  allowedSections?: string[];
  documentIds?: string[]; // For bulk document sharing
  expiresAt?: Date;
  internalNotes?: string;
}

export interface UpdateShareRequest {
  shareId: string;
  permissionLevel?: 'view' | 'download';
  allowedSections?: string[];
  documentIds?: string[];
  expiresAt?: Date;
  internalNotes?: string;
}

export interface CreateAccessRequestRequest {
  dataRoomId: string;
  requestReason: string;
  requestedSections?: string[];
  organizationName: string;
  contactEmail: string;
}

export interface ApproveAccessRequestRequest {
  requestId: string;
  permissionLevel: 'view' | 'download';
  allowedSections?: string[];
  documentIds?: string[];
  expiresAt?: Date;
}

export interface RejectAccessRequestRequest {
  requestId: string;
  reviewNotes: string;
}

export interface AccessLogEntry {
  dataRoomId: string;
  actionType: 'view' | 'download' | 'export' | 'share' | 'request_access';
  sectionKey?: string;
  documentId?: string;
  metadata?: Record<string, any>;
}

export interface AccessLogFilters {
  userId?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  sectionKey?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentFilters {
  sectionId?: string;
  category?: string;
  tags?: string[];
  documentType?: 'file' | 'link';
  isShareable?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
}

// ============================================
// UI-SPECIFIC MODELS
// ============================================

export interface DataRoomSectionConfig {
  id: string;
  title: string;
  icon: any; // Lucide icon
  status: 'complete' | 'pending' | 'missing';
  description: string;
  documentCount?: number;
}

export interface DocumentCategory {
  key: string;
  label: string;
  icon?: any;
  color?: string;
}

export interface ShareRecipient {
  userId: string;
  email: string;
  name?: string;
  companyName?: string;
  userType?: 'sme' | 'funder';
}

export interface BulkDocumentSelection {
  documentIds: string[];
  selectAll: boolean;
  excludedIds?: string[];
}

// ============================================
// DATABASE TRANSFORMERS (snake_case <-> camelCase)
// ============================================

export function transformDataRoomFromDB(dbRecord: any): DataRoom {
  return {
    id: dbRecord.id,
    organizationId: dbRecord.organization_id,
    title: dbRecord.title,
    description: dbRecord.description,
    isActive: dbRecord.is_active,
    visibility: dbRecord.visibility,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at)
  };
}

export function transformDataRoomToDB(dataRoom: Partial<DataRoom>): any {
  return {
    ...(dataRoom.id && { id: dataRoom.id }),
    ...(dataRoom.organizationId && { organization_id: dataRoom.organizationId }),
    ...(dataRoom.title && { title: dataRoom.title }),
    ...(dataRoom.description !== undefined && { description: dataRoom.description }),
    ...(dataRoom.isActive !== undefined && { is_active: dataRoom.isActive }),
    ...(dataRoom.visibility && { visibility: dataRoom.visibility }),
    ...(dataRoom.metadata && { metadata: dataRoom.metadata })
  };
}

export function transformDocumentFromDB(dbRecord: any): DataRoomDocument {
  return {
    id: dbRecord.id,
    dataRoomId: dbRecord.data_room_id,
    sectionId: dbRecord.section_id,
    documentId: dbRecord.document_id,
    externalUrl: dbRecord.external_url,
    documentType: dbRecord.document_type,
    category: dbRecord.category,
    title: dbRecord.title,
    description: dbRecord.description,
    tags: dbRecord.tags || [],
    isFeatured: dbRecord.is_featured,
    displayOrder: dbRecord.display_order,
    isShareable: dbRecord.is_shareable,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at)
  };
}

export function transformShareFromDB(dbRecord: any): DataRoomShare {
  return {
    id: dbRecord.id,
    dataRoomId: dbRecord.data_room_id,
    sharedWithUserId: dbRecord.shared_with_user_id,
    sharedByUserId: dbRecord.shared_by_user_id,
    permissionLevel: dbRecord.permission_level,
    allowedSections: dbRecord.allowed_sections,
    accessReason: dbRecord.access_reason,
    internalNotes: dbRecord.internal_notes,
    status: dbRecord.status,
    sharedAt: new Date(dbRecord.shared_at),
    expiresAt: dbRecord.expires_at ? new Date(dbRecord.expires_at) : undefined,
    revokedAt: dbRecord.revoked_at ? new Date(dbRecord.revoked_at) : undefined,
    lastAccessedAt: dbRecord.last_accessed_at ? new Date(dbRecord.last_accessed_at) : undefined,
    accessCount: dbRecord.access_count,
    downloadCount: dbRecord.download_count,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at)
  };
}

export function transformAccessRequestFromDB(dbRecord: any): DataRoomAccessRequest {
  return {
    id: dbRecord.id,
    dataRoomId: dbRecord.data_room_id,
    requesterId: dbRecord.requester_id,
    requestReason: dbRecord.request_reason,
    requestedSections: dbRecord.requested_sections,
    organizationName: dbRecord.organization_name,
    contactEmail: dbRecord.contact_email,
    status: dbRecord.status,
    reviewedByUserId: dbRecord.reviewed_by_user_id,
    reviewNotes: dbRecord.review_notes,
    reviewedAt: dbRecord.reviewed_at ? new Date(dbRecord.reviewed_at) : undefined,
    shareId: dbRecord.share_id,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at)
  };
}

export function transformAccessLogFromDB(dbRecord: any): DataRoomAccessLog {
  return {
    id: dbRecord.id,
    dataRoomId: dbRecord.data_room_id,
    userId: dbRecord.user_id,
    shareId: dbRecord.share_id,
    actionType: dbRecord.action_type,
    sectionKey: dbRecord.section_key,
    documentId: dbRecord.document_id,
    ipAddress: dbRecord.ip_address,
    userAgent: dbRecord.user_agent,
    sessionDuration: dbRecord.session_duration,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at)
  };
}

export function transformSectionFromDB(dbRecord: any): DataRoomSection {
  return {
    id: dbRecord.id,
    dataRoomId: dbRecord.data_room_id,
    sectionKey: dbRecord.section_key,
    title: dbRecord.title,
    description: dbRecord.description,
    displayOrder: dbRecord.display_order,
    isEnabled: dbRecord.is_enabled,
    icon: dbRecord.icon,
    metadata: dbRecord.metadata || {},
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at)
  };
}