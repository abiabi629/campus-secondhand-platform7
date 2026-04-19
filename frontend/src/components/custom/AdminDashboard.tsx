import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  apiAdminGetStats,
  apiAdminGetProducts,
  apiAdminReviewProduct,
  apiAdminGetReports,
  apiAdminResolveReport,
  apiAdminGetUsers,
  apiAdminBanUser,
  apiAdminGetAnnouncements,
  apiAdminCreateAnnouncement,
  apiAdminUpdateAnnouncement,
  apiAdminDeleteAnnouncement,
} from '../../lib/api';
import type { ProductWithSeller, ReportWithReporter, User, Announcement, AdminStats } from '../../types';

type AdminTab = 'overview' | 'products' | 'reports' | 'users' | 'announcements';

const CONDITION_LABELS: Record<string, string> = {
  'new': '全新',
  'like-new': '几乎全新',
  'used': '有使用痕迹',
  'damaged': '有明显痕迹',
};

const CATEGORY_LABELS: Record<string, string> = {
  books: '教材书籍',
  electronics: '数码电器',
  daily: '生活用品',
  sports: '运动器材',
  beauty: '美妆个护',
  other: '其它',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [productStatus, setProductStatus] = useState('pending');
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [annLoading, setAnnLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'announcements') loadAnnouncements();
  }, [activeTab, productStatus]);

  const loadStats = async () => {
    try {
      const res = await apiAdminGetStats();
      if (res.success) setStats(res.data);
    } catch { /* silent */ }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiAdminGetProducts(productStatus);
      if (res.success) setProducts(res.data);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await apiAdminGetReports();
      if (res.success) setReports(res.data);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiAdminGetUsers();
      if (res.success) setUsers(res.data);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiAdminGetAnnouncements();
      if (res.success) setAnnouncements(res.data);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiAdminReviewProduct(id, 'approve');
      if (res.success) {
        setProducts(prev => prev.filter(p => p.product.id !== id));
        toast.success('已通过审核');
        loadStats();
      }
    } catch { toast.error('操作失败'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      const res = await apiAdminReviewProduct(rejectModal.id, 'reject', rejectReason);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.product.id !== rejectModal.id));
        setRejectModal(null);
        setRejectReason('');
        toast.success('已驳回');
        loadStats();
      }
    } catch { toast.error('操作失败'); }
  };

  const handleResolveReport = async (id: string, status: string) => {
    try {
      const res = await apiAdminResolveReport(id, status);
      if (res.success) {
        setReports(prev => prev.map(r => r.report.id === id ? { ...r, report: { ...r.report, status } } : r));
        toast.success('已处理');
        loadStats();
      }
    } catch { toast.error('操作失败'); }
  };

  const handleBanUser = async (id: string, isBanned: boolean) => {
    try {
      const res = await apiAdminBanUser(id, isBanned);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned } : u));
        toast.success(isBanned ? '已封号' : '已解封');
      }
    } catch { toast.error('操作失败'); }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) { toast.error('请填写标题和内容'); return; }
    setAnnLoading(true);
    try {
      const res = await apiAdminCreateAnnouncement({ title: newAnnTitle, content: newAnnContent });
      if (res.success) {
        setAnnouncements(prev => [res.data, ...prev]);
        setNewAnnTitle('');
        setNewAnnContent('');
        toast.success('公告已发布');
      }
    } catch { toast.error('发布失败'); }
    finally { setAnnLoading(false); }
  };

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    try {
      const res = await apiAdminUpdateAnnouncement(id, { isActive });
      if (res.success) {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive } : a));
        toast.success(isActive ? '已启用' : '已禁用');
      }
    } catch { toast.error('操作失败'); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await apiAdminDeleteAnnouncement(id);
      if (res.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast.success('已删除');
      }
    } catch { toast.error('操作失败'); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const TABS: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: '付费板' },
    { id: 'products', label: '商品审核' },
    { id: 'reports', label: '举报处理' },
    { id: 'users', label: '用户管理' },
    { id: 'announcements', label: '公告管理' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">管理后台</h2>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold text-sm">
                {user.name[0]}
              </div>
              <div className="text-sm font-medium text-[#0F172A]">{user.name}</div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                退出
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F8FAFC] rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#0D9488]/80 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium opacity-80">今日新增用户</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold">{stats?.todayNewUsers ?? '--'}</div>
              <div className="text-xs opacity-70 mt-1">实时数据</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#64748B]">今日发布商品</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-[#0F172A]">{stats?.todayNewProducts ?? '--'}</div>
              <div className="text-xs text-[#64748B] mt-1">实时数据</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border-2 border-[#F59E0B]/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#64748B]">待审核商品</span>
                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-[#F59E0B]">{stats?.pendingProducts ?? '--'}</div>
              <div className="text-xs text-[#64748B] mt-1">需在24小时内处理</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border-2 border-[#EF4444]/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#64748B]">待处理举报</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-[#EF4444]">{stats?.pendingReports ?? '--'}</div>
              <div className="text-xs text-[#64748B] mt-1">需优先处理</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0F172A] mb-4">商品状态分布</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {['pending', 'approved', 'rejected', 'sold', 'removed'].map(s => {
                const count = stats?.statusCounts?.find(c => c.status === s)?.count ?? 0;
                const labels: Record<string, { label: string; color: string }> = {
                  pending: { label: '审核中', color: 'text-yellow-600 bg-yellow-50' },
                  approved: { label: '已发布', color: 'text-green-600 bg-green-50' },
                  rejected: { label: '已驳回', color: 'text-red-600 bg-red-50' },
                  sold: { label: '已售出', color: 'text-gray-600 bg-gray-50' },
                  removed: { label: '已下架', color: 'text-gray-600 bg-gray-50' },
                };
                const info = labels[s];
                return (
                  <div key={s} className={`p-4 rounded-xl ${info.color} text-center`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium mt-1">{info.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products Review */}
      {activeTab === 'products' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setProductStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  productStatus === s ? 'bg-[#0D9488] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#0D9488]/30'
                }`}
              >
                {s === 'all' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已驳回'}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">商品列表</h3>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B]">{products.length} 件</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-[#64748B]">加载中...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">暂无商品</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-6 py-3">商品信息</th>
                      <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3 hidden sm:table-cell">分类</th>
                      <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3 hidden md:table-cell">卖家</th>
                      <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3 hidden lg:table-cell">提交时间</th>
                      <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {products.map(item => {
                      let imgSrc = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=80&h=80&fit=crop';
                      try { const imgs = JSON.parse(item.product.images) as string[]; if (imgs.length > 0) imgSrc = imgs[0]; } catch { /* ignore */ }
                      return (
                        <tr key={item.product.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={imgSrc} alt="商品" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                              <div>
                                <div className="text-sm font-semibold text-[#0F172A] line-clamp-1">{item.product.title}</div>
                                <div className="text-xs text-[#64748B] mt-0.5">¥{item.product.price} · {CONDITION_LABELS[item.product.condition] || item.product.condition}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#F0FDFA] text-[#0D9488]">
                              {CATEGORY_LABELS[item.product.category] || item.product.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <div className="text-sm text-[#0F172A]">{item.seller?.name || '未知'}</div>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <div className="text-sm text-[#64748B]">{new Date(item.product.createdAt).toLocaleDateString('zh-CN')}</div>
                          </td>
                          <td className="px-4 py-4">
                            {item.product.status === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(item.product.id)}
                                  className="px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-xs font-semibold hover:bg-[#10B981]/90 transition-colors"
                                >
                                  通过
                                </button>
                                <button
                                  onClick={() => setRejectModal({ id: item.product.id })}
                                  className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold hover:bg-[#EF4444]/20 transition-colors"
                                >
                                  驳回
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.product.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.product.status === 'approved' ? '已通过' : '已驳回'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#0F172A]">举报列表</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#64748B]">加载中...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">暂无举报</div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {reports.map(item => (
                <div key={item.report.id} className="px-6 py-4 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#0F172A]">举报人：{item.reporter?.name || '未知'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          item.report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.report.status === 'pending' ? '待处理' : item.report.status === 'resolved' ? '已处理' : '已驳回'}
                        </span>
                      </div>
                      <p className="text-sm text-[#64748B] mt-1">原因：{item.report.reason} {item.report.description && `· ${item.report.description}`}</p>
                      <p className="text-xs text-[#64748B] mt-1">{new Date(item.report.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                    {item.report.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleResolveReport(item.report.id, 'resolved')}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-xs font-semibold hover:bg-[#10B981]/90 transition-colors"
                        >
                          处理
                        </button>
                        <button
                          onClick={() => handleResolveReport(item.report.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                        >
                          驳回
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#0F172A]">用户列表</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#64748B]">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-6 py-3">用户</th>
                    <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3 hidden sm:table-cell">邮箱</th>
                    <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3 hidden md:table-cell">角色</th>
                    <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {u.name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#0F172A]">{u.name}</div>
                            {u.isBanned && <span className="text-xs text-[#EF4444]">已封号</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-sm text-[#64748B]">{u.email}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-[#F0FDFA] text-[#0D9488]'
                        }`}>
                          {u.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBanUser(u.id, !u.isBanned)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.isBanned
                                ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                                : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                            }`}
                          >
                            {u.isBanned ? '解封' : '封号'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Create */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0F172A] mb-4">发布新公告</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newAnnTitle}
                onChange={e => setNewAnnTitle(e.target.value)}
                placeholder="公告标题"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
              />
              <textarea
                value={newAnnContent}
                onChange={e => setNewAnnContent(e.target.value)}
                rows={3}
                placeholder="公告内容"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none"
              />
              <button
                onClick={handleCreateAnnouncement}
                disabled={annLoading}
                className="px-6 py-3 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors disabled:opacity-60"
              >
                {annLoading ? '发布中...' : '发布公告'}
              </button>
            </div>
          </div>
          {/* List */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">公告列表</h3>
            </div>
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">暂无公告</div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {announcements.map(ann => (
                  <div key={ann.id} className="px-6 py-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#0F172A]">{ann.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ann.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {ann.isActive ? '已启用' : '已禁用'}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748B] mt-1 line-clamp-2">{ann.content}</p>
                        <p className="text-xs text-[#64748B] mt-1">{new Date(ann.createdAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleAnnouncement(ann.id, !ann.isActive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            ann.isActive
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                          }`}
                        >
                          {ann.isActive ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold hover:bg-[#EF4444]/20 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">驳回商品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="请说明驳回原因..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-[#F8FAFC] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-semibold hover:bg-[#EF4444]/90 transition-colors"
                >
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
