export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
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
