export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  studentId?: string | null;
  role: string;
  isVerified: boolean;
  verificationStatus: string;
  creditScore: number;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerInfo {
  id: string;
  name: string;
  avatar?: string | null;
  creditScore: number;
  isVerified: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string | null;
  category: string;
  condition: string;
  tradeMethod: string;
  tradeLocation?: string | null;
  images: string; // JSON string array
  status: string;
  rejectReason?: string | null;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithSeller {
  product: Product;
  seller: SellerInfo | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  productId?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationItem {
  message: Message;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

export interface Report {
  id: string;
  reporterId: string;
  productId?: string | null;
  reportedUserId?: string | null;
  reason: string;
  description?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportWithReporter {
  report: Report;
  reporter: { id: string; name: string } | null;
}

export interface Announcement {
  id: string;
  authorId: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  todayNewUsers: number;
  todayNewProducts: number;
  pendingProducts: number;
  pendingReports: number;
  statusCounts: Array<{ status: string; count: number }>;
}

export type ProductCategory = 'books' | 'electronics' | 'daily' | 'sports' | 'beauty' | 'other';
export type ProductCondition = 'new' | 'like-new' | 'used' | 'damaged';
export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'removed';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AppView =
  | 'home'
  | 'product-detail'
  | 'publish'
  | 'messages'
  | 'profile'
  | 'admin'
  | 'favorites';
