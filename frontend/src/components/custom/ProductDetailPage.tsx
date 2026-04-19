import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiGetProduct, apiToggleFavorite, apiGetFavorites, apiCreateReport } from '../../lib/api';
import type { ProductWithSeller, AppView } from '../../types';

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  'new': { label: '全新', color: 'bg-yellow-500 text-white' },
  'like-new': { label: '几乎全新', color: 'bg-[#10B981] text-white' },
  'used': { label: '有使用痕迹', color: 'bg-blue-500 text-white' },
  'damaged': { label: '有明显痕迹', color: 'bg-[#64748B] text-white' },
};

const CATEGORY_LABELS: Record<string, string> = {
  books: '教材书籍',
  electronics: '数码电器',
  daily: '生活用品',
  sports: '运动器材',
  beauty: '美妆个护',
  other: '其它',
};

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=500&fit=crop',
];

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: AppView, id?: string) => void;
  onChat: (sellerId: string, productId: string, sellerName: string) => void;
  currentUserId: string;
}

export default function ProductDetailPage({ productId, onNavigate, onChat, currentUserId }: ProductDetailPageProps) {
  const navigate = useNavigate();
  const [item, setItem] = useState<ProductWithSeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('fake');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetProduct(productId).then(res => {
      if (res.success) setItem(res.data);
      else toast.error('商品不存在');
      setLoading(false);
    });
    apiGetFavorites().then(res => {
      if (res.success) setIsFav(res.data.includes(productId));
    });
  }, [productId]);

  const handleToggleFav = async () => {
    try {
      const res = await apiToggleFavorite(productId);
      if (res.success) {
        setIsFav(res.data.favorited);
        toast.success(res.data.favorited ? '已收藏' : '已取消收藏');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleReport = async () => {
    setReportLoading(true);
    try {
      const res = await apiCreateReport({ productId, reason: reportReason, description: reportDesc });
      if (res.success) {
        toast.success('举报已提交，我们将尽快处理');
        setShowReport(false);
        setReportDesc('');
      }
    } catch {
      toast.error('举报失败');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="h-72 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const { product, seller } = item;
  let images: string[] = [];
  try { images = JSON.parse(product.images) as string[]; } catch { /* ignore */ }
  if (images.length === 0) images = PLACEHOLDER_IMAGES;

  const cond = CONDITION_LABELS[product.condition] || { label: product.condition, color: 'bg-gray-500 text-white' };
  const isOwner = product.sellerId === currentUserId;
  const isSold = product.status === 'sold';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition-colors mb-6 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        {/* Images */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={images[selectedImg]} alt={product.title} className="w-full h-72 sm:h-80 object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`图${i + 1}`}
                  onClick={() => setSelectedImg(i)}
                  className={`rounded-xl h-16 w-full object-cover cursor-pointer transition-all ${
                    selectedImg === i ? 'ring-2 ring-[#0D9488]' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0D9488]">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cond.color}`}>{cond.label}</span>
              {isSold && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">已售出</span>}
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] leading-tight">{product.title}</h1>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-bold text-[#0D9488]">¥{product.price}</span>
              {product.originalPrice && (
                <span className="text-base text-[#64748B] line-through">原价 ¥{product.originalPrice}</span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">成色</div>
              <div className="text-sm font-semibold text-[#0F172A]">{cond.label}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">交易地点</div>
              <div className="text-sm font-semibold text-[#0F172A]">{product.tradeLocation || '面议'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">交易方式</div>
              <div className="text-sm font-semibold text-[#0F172A]">{product.tradeMethod === 'face' ? '校内面交' : '送货上门'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">浏览次数</div>
              <div className="text-sm font-semibold text-[#0F172A]">{product.viewCount} 次</div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">商品描述</div>
            <p className="text-sm text-[#0F172A] leading-relaxed">{product.description}</p>
          </div>

          {/* Seller */}
          {seller && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F0FDFA] border border-[#0D9488]/20">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {seller.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#0F172A]">{seller.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(seller.creditScore / 20) ? 'text-[#F59E0B]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs text-[#64748B] ml-1">信用 {(seller.creditScore / 10).toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  {seller.isVerified ? '实名认证 ✓' : '未认证'}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isOwner && !isSold && (
            <div className="flex gap-3">
              <button
                onClick={() => seller && onChat(seller.id, product.id, seller.name)}
                className="flex-1 py-3.5 rounded-full bg-[#0D9488] text-white font-bold text-base hover:bg-[#0D9488]/90 hover:-translate-y-0.5 transition-all duration-200 shadow-md"
              >
                💬 我想要
              </button>
              <button
                onClick={handleToggleFav}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  isFav ? 'border-[#EF4444] text-[#EF4444]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#EF4444] hover:text-[#EF4444]'
                }`}
              >
                <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="w-12 h-12 rounded-full border-2 border-[#E2E8F0] text-[#64748B] flex items-center justify-center hover:border-[#EF4444] hover:text-[#EF4444] transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>
            </div>
          )}
          {isOwner && (
            <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#0D9488]/20 text-sm text-[#0D9488] font-medium text-center">
              这是你发布的商品 · 状态：{product.status === 'pending' ? '审核中' : product.status === 'approved' ? '已发布' : product.status === 'rejected' ? '已驳回' : '已售出'}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">举报商品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">举报原因</label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                >
                  <option value="fake">假货/不实</option>
                  <option value="fraud">诈骗行为</option>
                  <option value="prohibited">违规物品</option>
                  <option value="other">其它原因</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">补充说明（选填）</label>
                <textarea
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  rows={3}
                  placeholder="请详细描述问题..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-[#F8FAFC] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReport}
                  disabled={reportLoading}
                  className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-semibold hover:bg-[#EF4444]/90 transition-colors disabled:opacity-60"
                >
                  {reportLoading ? '提交中...' : '提交举报'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
