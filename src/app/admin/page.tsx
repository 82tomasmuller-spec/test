import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getDashboardData() {
  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    scheduledArticles,
    totalCategories,
    totalAffiliateClicks,
    recentArticles,
    recentLogs,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: 'published' } }),
    prisma.article.count({ where: { status: 'draft' } }),
    prisma.article.count({ where: { status: 'scheduled' } }),
    prisma.category.count(),
    prisma.affiliateLink.aggregate({ _sum: { clicks: true } }),
    prisma.article.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { author: { select: { name: true } }, category: true },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    stats: {
      totalArticles,
      publishedArticles,
      draftArticles,
      scheduledArticles,
      totalCategories,
      totalAffiliateClicks: totalAffiliateClicks._sum.clicks || 0,
    },
    recentArticles,
    recentLogs,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const { stats, recentArticles, recentLogs } = await getDashboardData();

  const statCards = [
    { label: 'Celkem článků', value: stats.totalArticles, color: 'bg-blue-500', href: '/admin/articles' },
    { label: 'Publikováno', value: stats.publishedArticles, color: 'bg-green-500', href: '/admin/articles?status=published' },
    { label: 'Rozpracováno', value: stats.draftArticles, color: 'bg-yellow-500', href: '/admin/articles?status=draft' },
    { label: 'Naplánováno', value: stats.scheduledArticles, color: 'bg-purple-500', href: '/admin/articles?status=scheduled' },
    { label: 'Kategorie', value: stats.totalCategories, color: 'bg-indigo-500', href: '/admin/settings' },
    { label: 'Affiliate kliky', value: stats.totalAffiliateClicks, color: 'bg-pink-500', href: '/admin/affiliates' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vítejte zpět, {session?.user?.name}.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + Nový článek
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Poslední články</h2>
            <Link href="/admin/articles" className="text-sm text-primary-600 hover:text-primary-700">
              Zobrazit vše
            </Link>
          </div>
          <div className="space-y-3">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/admin/articles/${article.id}/edit`}
                className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                  <p className="text-xs text-gray-500">
                    {article.author?.name} &middot; {article.category?.name || 'Bez kategorie'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                    article.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : article.status === 'scheduled'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {article.status}
                </span>
              </Link>
            ))}
            {recentArticles.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Žádné články</p>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Poslední aktivita</h2>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{log.user.name}</span>{' '}
                    {log.action} {log.entity}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString('cs-CZ')}
                  </p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Žádná aktivita</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
