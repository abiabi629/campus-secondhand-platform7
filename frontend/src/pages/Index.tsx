import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { apiGetUnreadCount } from '../lib/api';
import { API_BASE_URL } from '../config/constants';
import type { AppView } from '../types';

import HomePage from '../components/custom/HomePage';
import ProductDetailPage from '../components/custom/ProductDetailPage';
import PublishPage from '../components/custom/PublishPage';
import MessagesPage from '../components/custom/MessagesPage';
import ProfilePage from '../components/custom/ProfilePage';
import AdminDashboard from '../components/custom/AdminDashboard';
import OmniflowBadge from '../components/custom/OmniflowBadge';

interface ChatContext {
  sellerId: string;
  productId: string;
  sellerName: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Index() {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) setCurrentUser(data.data.user);
        });
    }
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      apiGetUnreadCount().then(res => {
        if (res.success) setUnreadCount(res.data.count);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (view: AppView, productId?: string) => {
    setCurrentView(view);
    if (productId) setSelectedProductId(productId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChat = (sellerId: string, productId: string, sellerName: string) => {
    setChatContext({ sellerId, productId, sellerName });
    setCurrentView('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
  };

  const NAV_ITEMS = [
    { id: 'home' as AppView, label: '首页', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'publish' as AppView, label: '发布闲置', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: 'messages' as AppView, label: '消息', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ), badge: unreadCount },
    { id: 'profile' as AppView, label: '个人中心', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ];

  if (currentUser?.role === 'admin') {
    NAV_ITEMS.push({ id: 'admin' as AppView, label: '管理后台', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )});
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-3 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0D9488] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[#0F172A] tracking-tight">校园好物</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/20">Beta</span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-[#0D9488] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F0FDFA] hover:text-[#0D9488]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('messages')}
                className="relative p-2 rounded-full hover:bg-[#F0FDFA] transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
                )}
              </button>

              {/* Publish Button (desktop) */}
              <button
                onClick={() => navigate('publish')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0D9488]/90 transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                发布闲置
              </button>

              {/* User Avatar */}
              <button
                onClick={() => navigate('profile')}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/70 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {currentUser?.name?.[0] || '?'}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-[#F0FDFA] transition-colors"
              >
                <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === item.id
                      ? 'bg-[#0D9488] text-white'
                      : 'text-[#64748B] hover:bg-[#F0FDFA] hover:text-[#0D9488]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出登录
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {currentView === 'home' && (
          <HomePage
            onNavigate={navigate}
            onPublish={() => navigate('publish')}
          />
        )}
        {currentView === 'product-detail' && selectedProductId && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={navigate}
            onChat={handleChat}
            currentUserId={currentUser?.id || ''}
          />
        )}
        {currentView === 'publish' && (
          <PublishPage onNavigate={navigate} />
        )}
        {currentView === 'messages' && (
          <MessagesPage
            currentUserId={currentUser?.id || ''}
            initialChatUserId={chatContext?.sellerId}
            initialProductId={chatContext?.productId}
            initialSellerName={chatContext?.sellerName}
          />
        )}
        {currentView === 'profile' && (
          <ProfilePage onNavigate={navigate} />
        )}
        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white mt-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#0D9488] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">校园好物</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                专为在校师生打造的安全可信二手交易平台，实名认证保障每一笔交易，促进校园资源循环利用。
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                <span className="text-xs text-white/50">平台运营正常 · 审核响应 &lt; 24小时</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-4">快速导航</h4>
              <ul className="space-y-2">
                {['首页', '发布闲置', '消息中心', '个人中心'].map((item, i) => (
                  <li key={item}>
                    <button
                      onClick={() => navigate(['home', 'publish', 'messages', 'profile'][i] as AppView)}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-4">帮助与支持</h4>
              <ul className="space-y-2">
                {['交易须知', '举报中心', '隐私政策', '联系我们'].map(item => (
                  <li key={item}>
                    <span className="text-sm text-white/70 cursor-pointer hover:text-white transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">© 2026 校园好物平台. 仅限在校师生使用.</p>
            <p className="text-xs text-white/40">商品审核通过率 &gt; 85% · 违规下架率 100%</p>
          </div>
        </div>
      </footer>

      <OmniflowBadge />
    </div>
  );
}
