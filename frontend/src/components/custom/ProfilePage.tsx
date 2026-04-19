import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiGetMyProducts, apiUpdateProduct, apiDeleteProduct, apiGetFavorites, apiGetProduct, apiToggleFavorite } from '../../lib/api';
import type { ProductWithSeller, AppView } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已发布', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  sold: { label: '已售出', color: 'bg-gray-100 text-gray-600' },
  removed: { label: '已下架', color: 'bg-gray-100 text-gray-600' },
};

interface ProfilePageProps {
  onNavigate: (view: AppView, id?: string) => void;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  studentId?: string | null;
  role: string;
  isVerified: boolean;
  creditScore: number;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductWithSeller[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'favorites' | 'settings'>('products');
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setUser(data.data.user);
            setEditName(data.data.user.name || '');
            setEditPhone(data.data.user.phone || '');
            setEditStudentId(data.data.user.studentId || '');
          }
        });
    }
    apiGetMyProducts().then(res => {
      if (res.success) setProducts(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      try {
        setFavoritesLoading(true);
        const favoriteIdsRes = await apiGetFavorites();
        if (favoriteIdsRes.success) {
          const favoriteIds = favoriteIdsRes.data;
          const favoriteProductsData = await Promise.all(
            favoriteIds.map(async (id) => {
              const productRes = await apiGetProduct(id);
              return productRes.success ? productRes.data : null;
            })
          );
          setFavoriteProducts(favoriteProductsData.filter(Boolean) as ProductWithSeller[]);
        }
      } catch (error) {
        console.error('获取收藏商品失败:', error);
      } finally {
        setFavoritesLoading(false);
      }
    };
    fetchFavoriteProducts();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, phone: editPhone, studentId: editStudentId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, name: editName, phone: editPhone, studentId: editStudentId } : prev);
        toast.success('个人信息已更新');
      } else {
        toast.error('更新失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSold = async (productId: string) => {
    try {
      const res = await apiUpdateProduct(productId, { status: 'sold' });
      if (res.success) {
        setProducts(prev => prev.map(p => p.product.id === productId ? { ...p, product: { ...p.product, status: 'sold' } } : p));
        toast.success('已标记为已售出');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('确定要删除这个商品吗？')) return;
    try {
      const res = await apiDeleteProduct(productId);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.product.id !== productId));
        toast.success('商品已删除');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      const res = await apiToggleFavorite(productId);
      if (res.success && !res.data.favorited) {
        setFavoriteProducts(prev => prev.filter(p => p.product.id !== productId));
        toast.success('已取消收藏');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const filteredProducts = filterStatus === 'all' ? products : products.filter(p => p.product.status === filterStatus);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
      </div>
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[#0F172A]">{user?.name || '加载中...'}</h2>
              {user?.isVerified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0D9488]">实名认证 ✓</span>
              )}
              {user?.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">管理员</span>
              )}
            </div>
            <p className="text-sm text-[#64748B] mt-1">{user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#0D9488]">{products.length}</div>
                <div className="text-xs text-[#64748B]">发布商品</div>
              </div>
              <div className="w-px h-8 bg-[#E2E8F0]"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#0D9488]">{products.filter(p => p.product.status === 'sold').length}</div>
                <div className="text-xs text-[#64748B]">已售出</div>
              </div>
              <div className="w-px h-8 bg-[#E2E8F0]"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#0D9488]">{(user?.creditScore ?? 50) / 10}</div>
                <div className="text-xs text-[#64748B]">信用分</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); }}
            className="flex-shrink-0 px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#EF4444] transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F8FAFC] rounded-xl p-1 w-fit">
        {[{ id: 'products', label: '我的商品' }, { id: 'favorites', label: '我的收藏' }, { id: 'settings', label: '个人设置' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'products' | 'favorites' | 'settings')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'sold'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s ? 'bg-[#0D9488] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#0D9488]/30'
                }`}
              >
                {s === 'all' ? '全部' : STATUS_LABELS[s]?.label || s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-200"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">暂无商品</h3>
              <p className="text-[#64748B] text-sm mb-4">发布你的第一件闲置吧</p>
              <button
                onClick={() => onNavigate('publish')}
                className="px-6 py-3 rounded-full bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors"
              >
                立即发布
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(item => {
                const statusInfo = STATUS_LABELS[item.product.status] || { label: item.product.status, color: 'bg-gray-100 text-gray-600' };
                let imgSrc = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=280&fit=crop';
                try {
                  const imgs = JSON.parse(item.product.images) as string[];
                  if (imgs.length > 0) imgSrc = imgs[0];
                } catch { /* ignore */ }
                return (
                  <div key={item.product.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={imgSrc} alt={item.product.title} className="w-full h-36 object-cover" />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-1">{item.product.title}</h3>
                      <div className="text-[#0D9488] font-bold text-sm mt-1">¥{item.product.price}</div>
                      {item.product.rejectReason && (
                        <p className="text-xs text-[#EF4444] mt-1">驳回原因：{item.product.rejectReason}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onNavigate('product-detail', item.product.id)}
                          className="flex-1 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                        >
                          查看
                        </button>
                        {item.product.status === 'approved' && (
                          <button
                            onClick={() => handleMarkSold(item.product.id)}
                            className="flex-1 py-1.5 rounded-lg bg-[#0D9488]/10 text-xs text-[#0D9488] font-medium hover:bg-[#0D9488]/20 transition-colors"
                          >
                            标记已售
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('edit', item.product.id)}
                          className="flex-1 py-1.5 rounded-lg border border-[#3B82F6]/30 text-xs text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.product.id)}
                          className="flex-1 py-1.5 rounded-lg border border-[#EF4444]/30 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div>
          {favoritesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-200"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">暂无收藏商品</h3>
              <p className="text-[#64748B] text-sm mb-4">浏览商品时点击心形图标收藏</p>
              <button
                onClick={() => onNavigate('home')}
                className="px-6 py-3 rounded-full bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors"
              >
                去浏览商品
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteProducts.map(item => {
                let imgSrc = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=280&fit=crop';
                try {
                  const imgs = JSON.parse(item.product.images) as string[];
                  if (imgs.length > 0) imgSrc = imgs[0];
                } catch { /* ignore */ }
                return (
                  <div key={item.product.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={imgSrc} alt={item.product.title} className="w-full h-36 object-cover" />
                      <button
                        onClick={() => handleRemoveFavorite(item.product.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <svg className="w-4 h-4 text-destructive" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-1">{item.product.title}</h3>
                      <div className="text-[#0D9488] font-bold text-sm mt-1">¥{item.product.price}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onNavigate('product-detail', item.product.id)}
                          className="flex-1 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                        >
                          查看
                        </button>
                        {item.product.status === 'approved' && (
                          <button
                            onClick={() => onNavigate('messages', item.seller?.id, item.product.id, item.seller?.name || '')}
                            className="flex-1 py-1.5 rounded-lg bg-[#0D9488]/10 text-xs text-[#0D9488] font-medium hover:bg-[#0D9488]/20 transition-colors"
                          >
                            联系卖家
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#0F172A]">个人信息设置</h3>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">昵称</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">手机号</label>
              <input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">学号</label>
              <input
                type="text"
                value={editStudentId}
                onChange={e => setEditStudentId(e.target.value)}
                placeholder="请输入学号"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
