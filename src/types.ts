export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt?: any;
  lastLogin?: any;
  role: 'user' | 'moderator' | 'admin' | 'superadmin' | string;
  isBanned?: boolean;
  banReason?: string;
  emailVerified?: boolean;
  verificationRequired?: boolean;
  deviceFingerprint?: string;
  accountStatus?: 'active' | 'banned' | 'suspicious' | string;
  isPremium?: boolean;
  isEmailVerified?: boolean;
  // Premium details
  premiumPlan?: string;
  premiumStart?: any;
  premiumExpiry?: any;
  premiumGrantedBy?: string;
  premiumGrantedAt?: any;
  premiumStatus?: 'active' | 'expired' | 'none';
}

export interface Bookmark {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceThumbnail?: string;
  createdAt: any;
}

export interface ReadingHistory {
  userId: string;
  resourceId: string;
  resourceTitle: string;
  lastPage: number;
  totalPages: number;
  percentage: number;
  zoom: number;
  scrollPosition: { x: number; y: number };
  updatedAt: any;
}

export interface Note {
  id: string;
  userId: string;
  resourceId: string;
  page: number;
  content: string;
  isSavedPage?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Highlight {
  id: string;
  userId: string;
  resourceId: string;
  page: number;
  type: 'text' | 'area';
  data: any; // PDF.js specific data
  color: string;
  createdAt: any;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  resourceIds: string[];
  createdAt: any;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  theme: string;
  subject: string;
  classLevel: string;
  board: string;
  bannerUrl: string;
  thumbnailUrl: string;
  pdfUrl: string;
  description: string;
  createdAt: any;
  viewCount: number;
  downloadCount: number;
}
