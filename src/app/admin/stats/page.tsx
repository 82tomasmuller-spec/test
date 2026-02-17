import prisma from '@/lib/prisma';

async function getStats() {
  const [
    articlesPerMonth,
    articlesByStatus,
    articlesByCategory,
    topAffiliateLinks,
    recentPublications,
  ] = await Promise.all([
    // Articles per month (last 6 months)
    prisma.$queryRaw`
      SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count
      FROM Article
      WHERE createdAt > datetime('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    ` as Promise<{ month: string; count: number }[]>,

    // Articles by status
    prisma.article.groupBy({
      by: ['status'],
      _count: true,
    }),

    // Articles by category
    prisma.category.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),

    // Top affiliate links
    prisma.affiliateLink.findMany({
      take: 10,
      orderBy: { clicks: 'desc' },
      include: { partner: { select: { name: true } } },
    }),

    // Recent publication log
    prisma.publicationLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalArticles = await prisma.article.count();
  const totalPublished = await prisma.article.count({ where: { status: 'published' } });
  const totalAffiliateClicks = await prisma.affiliateLink.aggregate({ _sum: { clicks: true } });
  const totalAffiliateRevenue = await prisma.affiliateLink.aggregate({ _sum: { revenue: true } });

  return {
    articlesPerMonth,
    articlesByStatus,
    articlesByCategory,
    topAffiliateLinks,
    recentPublications,
    totals: {
      articles: totalArticles,
      published: totalPublished,
      affiliateClicks: totalAffiliateClicks._sum.clicks || 0,
      affiliateRevenue: totalAffiliateRevenue._sum.revenue || 0,
    },
  };
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistiky</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Celkem článků</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totals.articles}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Publikováno</p>
          <p className="text-3xl font-bold text-green-600">{stats.totals.published}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Affiliate kliky</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totals.affiliateClicks}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Affiliate příjmy</p>
          <p className="text-3xl font-bold text-purple-600">{stats.totals.affiliateRevenue.toFixed(0)} Kč</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles by Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Články podle stavu</h2>
          <div className="space-y-3">
            {stats.articlesByStatus.map((item) => {
              const total = stats.totals.articles || 1;
              const percentage = Math.round((item._count / total) * 100);
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{item.status}</span>
                    <span className="text-gray-500">{item._count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Articles by Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Články podle kategorií</h2>
          <div className="space-y-3">
            {stats.articlesByCategory.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {cat._count.articles}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Affiliate Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top affiliate odkazy</h2>
          {stats.topAffiliateLinks.length > 0 ? (
            <div className="space-y-2">
              {stats.topAffiliateLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{link.name}</p>
                    <p className="text-xs text-gray-400">{link.partner.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{link.clicks} kliků</p>
                    <p className="text-xs text-gray-500">{link.revenue.toFixed(0)} Kč</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Žádné affiliate data</p>
          )}
        </div>

        {/* Articles per Month */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Články za měsíc</h2>
          {stats.articlesPerMonth.length > 0 ? (
            <div className="space-y-2">
              {stats.articlesPerMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(item.count) / 10) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {Number(item.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Žádná data</p>
          )}
        </div>
      </div>

      {/* Publication Log */}
      {stats.recentPublications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log publikací</h2>
          <div className="space-y-2">
            {stats.recentPublications.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm py-1">
                <span className="text-gray-400 w-36">
                  {new Date(log.createdAt).toLocaleString('cs-CZ')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.action === 'published'
                      ? 'bg-green-100 text-green-700'
                      : log.action === 'scheduled'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-gray-700">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
