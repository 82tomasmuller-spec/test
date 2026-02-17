import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: {
    default: 'Admin | AI Blog CMS',
    template: '%s | Admin',
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} userRole={session.user.role} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
