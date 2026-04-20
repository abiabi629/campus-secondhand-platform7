import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiGetConversations, apiGetConversation, apiSendMessage } from '../../lib/api';
import type { ConversationItem, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const QUICK_REPLIES = ['还在吗？', '最低多少錢？', '什么时候可以交易？', '能再便宜一点吗？', '已售出了吗？'];

interface MessagesPageProps {
  currentUserId: string;
  initialChatUserId?: string;
  initialProductId?: string;
  initialSellerName?: string;
}

interface ConversationSummary {
  userId: string;
  userName: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MessagesPage({ currentUserId }: MessagesPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChatUserId = searchParams.get('userId') || undefined;
  const initialProductId = searchParams.get('productId') || undefined;
  const initialSellerName = searchParams.get('sellerName') ? decodeURIComponent(searchParams.get('sellerName')!) : undefined;
  const { user } = useAuth();
  const currentUser = user?.id || currentUserId;
  
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(initialChatUserId || null);
  const [activeUserName, setActiveUserName] = useState(initialSellerName || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeUserId) {
      loadMessages(activeUserId);
    }
  }, [activeUserId]);

  // 定时轮询检查新消息
  useEffect(() => {
    const intervalId = setInterval(() => {
      // 加载会话列表，确保左边视窗更新
      loadConversations();
      // 如果有活跃的聊天，加载消息，确保右边视窗更新
      if (activeUserId) {
        loadMessages(activeUserId);
      }
    }, 3000); // 每3秒检查一次新消息，提高同步速度

    return () => clearInterval(intervalId);
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await apiGetConversations();
      if (res.success) {
        // Deduplicate by other user
        const seen = new Set<string>();
        const convs: ConversationSummary[] = [];
        for (const item of res.data) {
          const otherId = item.message.senderId === currentUser ? item.message.receiverId : item.message.senderId;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            convs.push({
              userId: otherId,
              userName: item.sender?.name || '用户',
              lastMessage: item.message.content,
              lastTime: item.message.createdAt,
              unread: !item.message.isRead && item.message.receiverId === currentUser,
            });
          }
        }
        setConversations(convs);
      }
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await apiGetConversation(userId); // 移除initialProductId参数，加载与该用户的所有消息
      if (res.success) setMessages(res.data.reverse()); // 反转消息数组，最新消息在底部
    } catch {
      toast.error('加载消息失败');
    }
  };

  const handleSend = async (text?: string) => {
    const content = text || inputText.trim();
    if (!content || !activeUserId) return;
    setSending(true);
    try {
      const res = await apiSendMessage({
        receiverId: activeUserId,
        content,
        // 移除productId参数，确保消息能够正确发送
      });
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setInputText('');
        // 重新加载会话列表和消息，确保左右两边同步
        loadConversations();
        loadMessages(activeUserId);
      }
    } catch {
      toast.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
      
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">消息中心</h2>
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversation List */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="text-sm font-bold text-[#0F172A]">会话列表</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[0,1,2].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-[#64748B]">暂无会话</p>
                <p className="text-xs text-[#64748B] mt-1">在商品详情页点击“我想要”开始聊天</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => { setActiveUserId(conv.userId); setActiveUserName(conv.userName); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors text-left ${
                    activeUserId === conv.userId ? 'bg-[#F0FDFA] border-r-2 border-[#0D9488]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.userName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0F172A] truncate">{conv.userName}</span>
                      <span className="text-xs text-[#64748B] flex-shrink-0 ml-2">{formatTime(conv.lastTime)}</span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread && <div className="w-2 h-2 rounded-full bg-[#0D9488] flex-shrink-0"></div>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col">
          {!activeUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-[#64748B]">选择一个会话开始聊天</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0D9488]/60 flex items-center justify-center text-white font-bold">
                  {activeUserName[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#0F172A]">{activeUserName}</div>
                  <div className="text-xs text-[#10B981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block"></span>
                    在线
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">发送第一条消息开始聊天吧！</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === currentUser;
                    return (
                      <div key={msg.id} className={`flex ${!isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs sm:max-w-sm">
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                            !isMe
                              ? 'bg-[#0D9488] text-white rounded-tr-sm'
                              : 'bg-[#F8FAFC] text-[#0F172A] rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`text-xs text-[#64748B] mt-1 ${!isMe ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.createdAt)}{!isMe && (msg.isRead ? ' ✓✓' : ' ✓')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 py-2 border-t border-[#E2E8F0] flex gap-2 overflow-x-auto">
                {QUICK_REPLIES.map(reply => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-xs text-[#64748B] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E8F0]">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || sending}
                  className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center hover:bg-[#0D9488]/90 transition-colors flex-shrink-0 disabled:opacity-60"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
