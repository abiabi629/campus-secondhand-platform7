import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiCreateProduct, apiGetProduct, apiUpdateProduct } from '../../lib/api';
import type { AppView } from '../../types';

const STEPS = ['上传图片', '填写信息', '设置价格', '提交审核'];

const CATEGORIES = [
  { value: 'books', label: '教材书籍' },
  { value: 'electronics', label: '数码电器' },
  { value: 'daily', label: '生活用品' },
  { value: 'sports', label: '运动器材' },
  { value: 'beauty', label: '美妆个护' },
  { value: 'other', label: '其它' },
];

const CONDITIONS = [
  { value: 'new', label: '全新' },
  { value: 'like-new', label: '几乎全新' },
  { value: 'used', label: '有使用痕迹' },
  { value: 'damaged', label: '有明显痕迹' },
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop',
];

interface PublishPageProps {
  onNavigate: (view: AppView) => void;
}

export default function PublishPage({ onNavigate }: PublishPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [tradeMethod, setTradeMethod] = useState('face');
  const [tradeLocation, setTradeLocation] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);
  
  const loadProduct = async () => {
    if (!productId) return;
    setLoadingProduct(true);
    try {
      const res = await apiGetProduct(productId);
      if (res.success) {
        const product = res.data.product;
        setTitle(product.title);
        setCategory(product.category);
        setCondition(product.condition);
        setDescription(product.description);
        setPrice(product.price.toString());
        setOriginalPrice(product.originalPrice?.toString() || '');
        setTradeMethod(product.tradeMethod);
        setTradeLocation(product.tradeLocation || '');
        try {
          const imgs = JSON.parse(product.images) as string[];
          if (imgs.length > 0) setImages(imgs);
        } catch { /* ignore */ }
      } else {
        toast.error('加载商品信息失败');
      }
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setLoadingProduct(false);
    }
  };

  const addSampleImage = (url: string) => {
    if (images.length < 9) setImages(prev => [...prev, url]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newImages = [...images];
        for (let i = 0; i < files.length && newImages.length < 9; i++) {
          const file = files[i];
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (result && typeof result === 'string') {
              setImages(prev => {
                if (prev.length < 9) {
                  return [...prev, result];
                }
                return prev;
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };
    input.click();
  };

  const canProceed = () => {
    if (step === 0) return images.length > 0;
    if (step === 1) return title.trim().length > 0 && category && condition && description.trim().length > 0;
    if (step === 2) return price && parseFloat(price) > 0;
    if (step === 3) return agreed;
    return false;
  };

  const handleSubmit = async () => {
    if (!agreed) { toast.error('请同意交易须知'); return; }
    setLoading(true);
    try {
      const productData = {
        title,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        category,
        condition,
        tradeMethod,
        tradeLocation: tradeLocation || undefined,
        images: JSON.stringify(images),
      };
      
      let res;
      if (productId) {
        res = await apiUpdateProduct(productId, productData);
      } else {
        res = await apiCreateProduct(productData);
      }
      
      if (res.success) {
        setSubmitted(true);
        toast.success(productId ? '商品已更新' : '商品已提交审核，请耐心等待');
      } else {
        toast.error('提交失败，请重试');
      }
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-3">提交成功！</h2>
        <p className="text-[#64748B] mb-8">商品已提交审核，审核通过后将自动发布。平均审核时间24小时内。</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setSubmitted(false); setStep(0); setImages([]); setTitle(''); setCategory(''); setCondition(''); setDescription(''); setPrice(''); setOriginalPrice(''); setAgreed(false); }}
            className="px-6 py-3 rounded-full bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors"
          >
            继续发布
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="px-6 py-3 rounded-full border-2 border-[#0D9488] text-[#0D9488] font-semibold hover:bg-[#F0FDFA] transition-colors"
          >
            查看我的商品
          </button>
        </div>
      </div>
    );
  }

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
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-1">{productId ? '编辑闲置商品' : '发布闲置商品'}</h2>
        <p className="text-[#64748B] text-sm">{productId ? '修改商品信息' : '4步简单流程，快速挂出你的闲置物品'}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < step ? 'bg-[#10B981] text-white' : i === step ? 'bg-[#0D9488] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
              }`}>
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-sm font-semibold whitespace-nowrap ${
                i === step ? 'text-[#0D9488]' : i < step ? 'text-[#10B981]' : 'text-[#64748B]'
              }`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 w-8 sm:w-12 ${
                i < step ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5 shadow-sm">

          {/* Step 0: Images */}
          {step === 0 && (
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-3">
                商品图片 <span className="text-[#EF4444]">*</span>
                <span className="text-xs font-normal text-[#64748B] ml-1">(最多9张，请上传实拍图)</span>
              </label>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img} alt={`图${i+1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >×</button>
                  </div>
                ))}
                {images.length < 9 && (
                  <div 
                    onClick={handleAddImage}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#0D9488]/40 bg-[#F0FDFA] flex flex-col items-center justify-center cursor-pointer hover:border-[#0D9488] hover:bg-[#0D9488]/5 transition-all"
                  >
                    <svg className="w-6 h-6 text-[#0D9488] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-[#0D9488] font-medium">添加图片</span>
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-3">示例图片（点击添加）：</p>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_IMAGES.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`示例${i+1}`}
                      onClick={() => addSampleImage(img)}
                      className="rounded-lg h-16 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-[#0D9488]"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  商品标题 <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value.slice(0, 50))}
                  placeholder="简洁描述商品，如：高等数学上册 同济第七版"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                />
                <div className="text-xs text-[#64748B] mt-1 text-right">{title.length}/50字</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">商品分类 <span className="text-[#EF4444]">*</span></label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                  >
                    <option value="none">请选择分类</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">商品成色 <span className="text-[#EF4444]">*</span></label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                  >
                    <option value="none">请选择成色</option>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">商品描述 <span className="text-[#EF4444]">*</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 500))}
                  rows={4}
                  placeholder="详细描述商品状态、购买时间、附件等信息..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none"
                />
                <div className="text-xs text-[#64748B] mt-1 text-right">{description.length}/500字</div>
              </div>
            </div>
          )}

          {/* Step 2: Price */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">期望售价 <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">¥</span>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">原价 <span className="text-xs font-normal text-[#64748B]">（选填）</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">¥</span>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={e => setOriginalPrice(e.target.value)}
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-3">交易方式 <span className="text-[#EF4444]">*</span></label>
                <div className="flex gap-3">
                  {[{ value: 'face', label: '校内面交' }, { value: 'delivery', label: '送货上门' }].map(m => (
                    <label key={m.value} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer flex-1 transition-colors ${
                      tradeMethod === m.value ? 'border-[#0D9488] bg-[#F0FDFA]' : 'border-[#E2E8F0] hover:border-[#0D9488]/30'
                    }`}>
                      <input type="radio" name="tradeMethod" value={m.value} checked={tradeMethod === m.value} onChange={() => setTradeMethod(m.value)} className="accent-[#0D9488]" />
                      <span className={`text-sm font-medium ${tradeMethod === m.value ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">交易地点 <span className="text-xs font-normal text-[#64748B]">（选填）</span></label>
                <input
                  type="text"
                  value={tradeLocation}
                  onChange={e => setTradeLocation(e.target.value)}
                  placeholder="如：图书馆门口、学生活动中心"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 3: Submit */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">提交信息确认</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[#64748B]">标题：</span><span className="font-medium text-[#0F172A]">{title}</span></div>
                  <div><span className="text-[#64748B]">售价：</span><span className="font-bold text-[#0D9488]">¥{price}</span></div>
                  <div><span className="text-[#64748B]">分类：</span><span className="font-medium text-[#0F172A]">{CATEGORIES.find(c => c.value === category)?.label}</span></div>
                  <div><span className="text-[#64748B]">成色：</span><span className="font-medium text-[#0F172A]">{CONDITIONS.find(c => c.value === condition)?.label}</span></div>
                  <div><span className="text-[#64748B]">图片：</span><span className="font-medium text-[#0F172A]">{images.length} 张</span></div>
                  <div><span className="text-[#64748B]">交易：</span><span className="font-medium text-[#0F172A]">{tradeMethod === 'face' ? '校内面交' : '送货上门'}</span></div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#0D9488] w-4 h-4 flex-shrink-0"
                />
                <label htmlFor="agree" className="text-sm text-[#64748B] leading-relaxed cursor-pointer">
                  我已阅读并同意 <span className="text-[#0D9488] font-medium">《校园二手交易须知》</span>，确认商品为本人合法闲置物品，不含违规电器、药品等禁售物品。
                </label>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!agreed || loading}
                className="w-full py-4 rounded-xl bg-[#0D9488] text-white font-bold text-base hover:bg-[#0D9488]/90 hover:-translate-y-0.5 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? '提交中...' : productId ? '保存修改' : '提交审核'}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 3 && (
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-[#F8FAFC] transition-colors"
                >
                  上一步
                </button>
              )}
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-[#0D9488]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
