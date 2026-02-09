import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, Activity, AlertTriangle, LogOut } from 'lucide-react';
import type { User } from '../types';

interface Props {
  user: User;
  children: React.ReactNode;
}

export default function Layout({ user, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">ShopAlert</h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    isActive('/')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/shops"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    isActive('/shops')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <Store className="w-4 h-4 mr-2" />
                  E-shopy
                </Link>
                <Link
                  to="/monitors"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    isActive('/monitors')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Monitory
                </Link>
                <Link
                  to="/incidents"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    isActive('/incidents')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Incidenty
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">{user.name}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Odhlásit
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
