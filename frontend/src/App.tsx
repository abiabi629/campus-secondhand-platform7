import { HashRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/custom/Login';
import Signup from './components/custom/Signup';
import HomePage from './components/custom/HomePage';
import PublishPage from './components/custom/PublishPage';
import ProfilePage from './components/custom/ProfilePage';
import AdminDashboard from './components/custom/AdminDashboard';
import ProductDetailPage from './components/custom/ProductDetailPage';
import MessagesPage from './components/custom/MessagesPage';
import { Toaster } from './components/ui/sonner';

const ProductDetailPageWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleNavigate = (view: string, productId?: string) => {
    switch (view) {
      case 'home':
        navigate('/');
        break;
      case 'product-detail':
        if (productId) {
          navigate(`/product/${productId}`);
        }
        break;
      default:
        break;
    }
  };
  
  const handleChat = (sellerId: string, productId: string, sellerName: string) => {
    navigate(`/messages?userId=${sellerId}&productId=${productId}&sellerName=${encodeURIComponent(sellerName)}`);
  };
  
  return <ProductDetailPage productId={id || ''} onNavigate={handleNavigate} onChat={handleChat} currentUserId={user?.id || ''} />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (view: string, productId?: string, sellerId?: string, sellerName?: string) => {
    switch (view) {
      case 'product-detail':
        if (productId) {
          navigate(`/product/${productId}`);
        }
        break;
      case 'publish':
        navigate('/publish');
        break;
      case 'edit':
        if (productId) {
          navigate(`/publish?productId=${productId}`);
        }
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'messages':
        if (sellerId && productId && sellerName) {
          navigate(`/messages?userId=${sellerId}&productId=${productId}&sellerName=${encodeURIComponent(sellerName)}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'home':
        navigate('/');
        break;
      default:
        break;
    }
  };

  const handlePublish = () => {
    navigate('/publish');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0D9488] flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-[#64748B] text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route
        path="/"
        element={isAuthenticated ? (
          // 检查用户角色，管理员跳转到 AdminDashboard，普通用户跳转到首页
          localStorage.getItem('userRole') === 'admin' ? <Navigate to="/admin" replace /> : <HomePage onNavigate={handleNavigate} onPublish={handlePublish} />
        ) : <Navigate to="/login" replace />}
      />
      <Route
        path="/publish"
        element={isAuthenticated ? <PublishPage onNavigate={handleNavigate} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/product/:id"
        element={isAuthenticated ? <ProductDetailPageWrapper /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage onNavigate={handleNavigate} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/admin"
        element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/messages"
        element={isAuthenticated ? <MessagesPage currentUserId={user?.id || ''} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <HashRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" />
    </AuthProvider>
  </HashRouter>
);

export default App;
