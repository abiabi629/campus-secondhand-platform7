import { API_BASE_URL } from '../config/constants';
import type {
  ApiResponse,
  ProductWithSeller,
  Product,
  Message,
  ConversationItem,
  Report,
  ReportWithReporter,
  Announcement,
  AdminStats,
  User,
} from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
  });
  return response.json() as Promise<ApiResponse<T>>;
};

// Products
export const apiGetProducts = (params?: {
  category?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiFetch<ProductWithSeller[]>(`/api/products${qs ? '?' + qs : ''}`);
};

export const apiGetProduct = (id: string) =>
  apiFetch<ProductWithSeller>(`/api/products/${id}`);

export const apiGetMyProducts = () =>
  apiFetch<ProductWithSeller[]>('/api/products/my');

export const apiCreateProduct = (data: Record<string, unknown>) =>
  apiFetch<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateProduct = (id: string, data: Record<string, unknown>) =>
  apiFetch<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiDeleteProduct = (id: string) =>
  apiFetch<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' });

export const apiToggleFavorite = (id: string) =>
  apiFetch<{ favorited: boolean }>(`/api/products/${id}/favorite`, { method: 'POST' });

export const apiGetFavorites = () =>
  apiFetch<string[]>('/api/products/favorites');

// Messages
export const apiGetConversations = () =>
  apiFetch<ConversationItem[]>('/api/messages/conversations');

export const apiGetConversation = (userId: string, productId?: string) => {
  const qs = productId ? `?productId=${productId}` : '';
  return apiFetch<Message[]>(`/api/messages/${userId}${qs}`);
};

export const apiSendMessage = (data: { receiverId: string; content: string; productId?: string }) =>
  apiFetch<Message>('/api/messages', { method: 'POST', body: JSON.stringify(data) });

export const apiGetUnreadCount = () =>
  apiFetch<{ count: number }>('/api/messages/unread');

// Reports
export const apiCreateReport = (data: {
  productId?: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
}) => apiFetch<Report>('/api/reports', { method: 'POST', body: JSON.stringify(data) });

// Announcements (public)
export const apiGetAnnouncements = () =>
  apiFetch<Announcement[]>('/api/announcements');

// Admin
export const apiAdminGetStats = () =>
  apiFetch<AdminStats>('/api/admin/stats');

export const apiAdminGetProducts = (status?: string) => {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<ProductWithSeller[]>(`/api/admin/products${qs}`);
};

export const apiAdminReviewProduct = (id: string, action: 'approve' | 'reject', rejectReason?: string) =>
  apiFetch<Product>(`/api/admin/products/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ action, rejectReason }),
  });

export const apiAdminGetReports = (status?: string) => {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<ReportWithReporter[]>(`/api/admin/reports${qs}`);
};

export const apiAdminResolveReport = (id: string, status: string, adminNote?: string) =>
  apiFetch<Report>(`/api/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, adminNote }),
  });

export const apiAdminGetUsers = () =>
  apiFetch<User[]>('/api/admin/users');

export const apiAdminBanUser = (id: string, isBanned: boolean) =>
  apiFetch<User>(`/api/admin/users/${id}/ban`, {
    method: 'PUT',
    body: JSON.stringify({ isBanned }),
  });

export const apiAdminGetAnnouncements = () =>
  apiFetch<Announcement[]>('/api/admin/announcements');

export const apiAdminCreateAnnouncement = (data: { title: string; content: string }) =>
  apiFetch<Announcement>('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiAdminUpdateAnnouncement = (id: string, data: Partial<{ title: string; content: string; isActive: boolean }>) =>
  apiFetch<Announcement>(`/api/admin/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiAdminDeleteAnnouncement = (id: string) =>
  apiFetch<{ message: string }>(`/api/admin/announcements/${id}`, { method: 'DELETE' });

// Auth
export const apiGetMe = () =>
  apiFetch<{ user: User }>('/api/auth/me');

export const apiUpdateProfile = (data: Partial<User>) =>
  apiFetch<User>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) });
