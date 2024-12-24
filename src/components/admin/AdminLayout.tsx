import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  ShoppingBag,
  Tags,
  Layers,
  Building2,
  MessageSquare,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { cn } from '../../utils/cn.js';
import { AdminHeader } from './AdminHeader.js';

interface AdminLayoutProps {
  children: ReactNode;
}

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavigationGroup = {
  name: string;
  items: NavigationItem[];
};

const navigation: (NavigationItem | NavigationGroup)[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { 
    name: 'Product Management',
    items: [
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: Tags },
      { name: 'Types', href: '/admin/types', icon: Layers },
      { name: 'Brands', href: '/admin/brands', icon: Building2 },
    ]
  },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 bg-black text-white md:justify-center">
        <span className="text-xl font-bold">PINPINUN SHOP Admin</span>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg hover:bg-gray-800 md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-5 overflow-y-auto">
        {navigation.map((item) => {
          const isGroup = (item: NavigationItem | NavigationGroup): item is NavigationGroup => 
            'items' in item;

          if (isGroup(item)) {
            return (
              <div key={item.name} className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  {item.name}
                </p>
                {item.items.map((subItem) => {
                  const Icon = subItem.icon;
                  return (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        location.pathname === subItem.href
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            );
          } else {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === item.href
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          }
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow bg-black">
            <Sidebar />
          </div>
        </div>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-black z-40 md:hidden">
              <Sidebar />
            </div>
          </>
        )}

        {/* Mobile menu button */}
        <div className="fixed top-16 left-4 z-20 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-white shadow-md hover:bg-gray-100"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}