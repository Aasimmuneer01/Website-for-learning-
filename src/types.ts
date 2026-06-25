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
