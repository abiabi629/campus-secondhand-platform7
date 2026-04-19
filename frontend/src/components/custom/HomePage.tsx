import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGetProducts, apiGetAnnouncements, apiToggleFavorite, apiGetFavorites, apiGetUnreadCount } from '../../lib/api';
import type { ProductWithSeller, Announcement, AppView } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: '🏠', color: 'bg-primary text-white' },
  { id: 'books', label: '教材书籍', icon: '📚', color: 'bg-secondary text-foreground' },
  { id: 'electronics', label: '数码电器', icon: '💻', color: 'bg-secondary text-foreground' },
  { id: 'daily', label: '生活用品', icon: '🏠', color: 'bg-secondary text-foreground' },
  { id: 'sports', label: '运动器材', icon: '⚡', color: 'bg-secondary text-foreground' },
  { id: 'beauty', label: '美妆个护', icon: '💄', color: 'bg-secondary text-foreground' },
  { id: 'other', label: '其它', icon: '✨', color: 'bg-secondary text-foreground' },
];

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  'new': { label: '全新', color: 'bg-accent text-accent-foreground font-semibold' },
  'like-new': { label: '几乎全新', color: 'bg-green-500 text-white' },
  'used': { label: '有使用痕迹', color: 'bg-primary text-white' },
  'damaged': { label: '有明显痕迹', color: 'bg-muted-foreground text-white' },
};

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=280&fit=crop',
];

function getProductImage(product: ProductWithSeller, index: number): string {
  try {
    const imgs = JSON.parse(product.product.images) as string[];
    if (imgs.length > 0) return imgs[0];
  } catch (error) {
    console.error('Error parsing product images:', error);
    console.error('Product images:', product.product.images);
  }
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return `${Math.floor(days / 7)}周前`;
}

interface HomePageProps {
  onNavigate: (view: AppView, productId?: string) => void;
  onPublish: () => void;
}

export default function HomePage({ onNavigate, onPublish }: HomePageProps) {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
  };

  const loadProducts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : page * 20;
      const res = await apiGetProducts({
        category: activeCategory === 'all' ? undefined : activeCategory,
        search: searchQuery || undefined,
        sortBy,
        limit: 20,
        offset,
      });
      if (res.success) {
        if (reset) {
          setProducts(res.data);
          setPage(0);
        } else {
          setProducts(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 20);
      }
    } catch {
      toast.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, sortBy, page]);

  // 处理返回全部商品
  const handleReturnAll = () => {
    // 直接清空搜索框并重新加载商品，不依赖状态更新
    setSearchQuery('');
    setActiveCategory('all');
    // 直接调用apiGetProducts获取所有商品
    setLoading(true);
    apiGetProducts({
      category: undefined,
      search: undefined,
      sortBy,
      limit: 20,
      offset: 0,
    }).then(res => {
      if (res.success) {
        setProducts(res.data);
        setPage(0);
        setHasMore(res.data.length === 20);
      }
    }).catch(() => {
      toast.error('加载商品失败');
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProducts(true);
  }, [activeCategory, sortBy]);

  useEffect(() => {
    apiGetAnnouncements().then(res => {
      if (res.success) setAnnouncements(res.data);
    });
    apiGetFavorites().then(res => {
      if (res.success) setFavorites(res.data);
    });
    apiGetUnreadCount().then(res => {
      if (res.success) setUnreadCount(res.data.count);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索后保持搜索框内容，确保"返回全部"按钮显示
    loadProducts(true);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    try {
      const res = await apiToggleFavorite(productId);
      if (res.success) {
        if (res.data.favorited) {
          setFavorites(prev => [...prev, productId]);
          toast.success('已收藏');
        } else {
          setFavorites(prev => prev.filter(id => id !== productId));
          toast.success('已取消收藏');
        }
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadProducts(false);
  };

  const activeAnnouncement = announcements.find(a => a.isActive);

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground">校园闲置</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <button className="text-primary font-semibold">首页</button>
              <button onClick={onPublish} className="text-muted-foreground hover:text-foreground transition-colors">发布</button>
              <button onClick={() => onNavigate('profile')} className="text-muted-foreground hover:text-foreground transition-colors">个人中心</button>
              <button onClick={() => onNavigate('messages')} className="relative text-muted-foreground hover:text-foreground transition-colors">
                消息
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-medium">
                      {user.name?.[0] || user.email?.[0] || '?'} 
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-foreground">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.role === 'admin' ? '管理员' : '用户'}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                    退出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Announcement Banner */}
      {activeAnnouncement && showAnnouncement && (
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white animate-fade-in">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span className="font-medium flex-shrink-0">📢 {activeAnnouncement.title}：</span>
              <span className="opacity-90 truncate">{activeAnnouncement.content}</span>
            </div>
            <button onClick={() => setShowAnnouncement(false)} className="text-white/70 hover:text-white transition-colors flex-shrink-0 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-b border-border animate-fade-in">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                仅限在校师生 · 实名认证
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-4">
                校园闲置<br /><span className="text-primary">一键流转</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                安全可信的校园二手交易平台，实名认证保障每一笔交易，让闲置物品找到新主人。
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onPublish}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  立即发布闲置
                </button>
                <button
                  onClick={() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  浏览好物
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1,200+</div>
                  <div className="text-xs text-muted-foreground mt-0.5">认证用户</div>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{products.length > 0 ? `${products.length}+` : '3,800+'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">在售商品</div>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">好评率</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {[0, 1].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer" onClick={() => products[i] && onNavigate('product-detail', products[i].product.id)}>
                    <img src={products[i] ? getProductImage(products[i], i) : PLACEHOLDER_IMAGES[i]} alt="商品" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="p-3 bg-white">
                      <div className="text-sm font-semibold text-[#0F172A] truncate">{products[i]?.product.title || '精选好物'}</div>
                      <div className="text-[#0D9488] font-bold text-sm mt-1">¥{products[i]?.product.price || '--'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4 mt-6">
                {[2, 3].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer" onClick={() => products[i] && onNavigate('product-detail', products[i].product.id)}>
                    <img src={products[i] ? getProductImage(products[i], i) : PLACEHOLDER_IMAGES[i]} alt="商品" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="p-3 bg-white">
                      <div className="text-sm font-semibold text-[#0F172A] truncate">{products[i]?.product.title || '精选好物'}</div>
                      <div className="text-[#0D9488] font-bold text-sm mt-1">¥{products[i]?.product.price || '--'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Nav */}
      <section className="bg-white border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 border ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white border-transparent shadow-md'
                    : 'bg-secondary text-foreground border-border hover:bg-primary/5 hover:border-primary/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  activeCategory === cat.id ? 'bg-white/20' : 'bg-white shadow-sm'
                }`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main id="product-grid" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">最新发布</h2>
            <p className="text-sm text-muted-foreground mt-1">共 {products.length} 件在售商品</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      loadProducts(true);
                    }
                  }}
                  placeholder="搜索商品..."
                  className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-full border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={handleReturnAll}
                  className="px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  返回全部
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {['latest', 'price-asc', 'price-desc'].map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-primary/5'
                  }`}
                >
                  {['最新', '价格↑', '价格↓'][i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">暂无商品</h3>
            <p className="text-[#64748B] text-sm">换个分类或关键词试试吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((item, index) => {
              const isSold = item.product.status === 'sold';
              const isFav = favorites.includes(item.product.id);
              const cond = CONDITION_LABELS[item.product.condition] || { label: item.product.condition, color: 'bg-gray-500 text-white' };
              return (
                <div
                  key={item.product.id}
                  onClick={() => !isSold && onNavigate('product-detail', item.product.id)}
                  className={`group bg-white rounded-2xl overflow-hidden border border-border transition-all duration-300 cursor-pointer animate-fade-in ${
                    isSold ? 'opacity-70' : 'hover:border-primary/30 hover:shadow-xl hover:-translate-y-1'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={getProductImage(item, index)}
                      alt={item.product.title}
                      className={`w-full h-40 object-cover transition-transform duration-300 ${
                        isSold ? 'grayscale' : 'group-hover:scale-105'
                      }`}
                    />
                    {isSold ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-muted-foreground">已售出</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cond.color}`}>{cond.label}</span>
                        </div>
                        <button
                          onClick={(e) => handleToggleFavorite(e, item.product.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <svg className={`w-4 h-4 ${isFav ? 'text-destructive' : 'text-muted-foreground'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{item.product.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className={`text-lg font-bold ${isSold ? 'text-muted-foreground' : 'text-primary'}`}>¥{item.product.price}</span>
                        {item.product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-1">¥{item.product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs flex-shrink-0">
                        {item.seller?.name?.[0] || '?'}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{item.seller?.name || '未知'} · {formatTimeAgo(item.product.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && products.length > 0 && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-8 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? '加载中...' : '加载更多商品'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
