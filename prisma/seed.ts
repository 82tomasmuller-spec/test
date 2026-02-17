import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  // Create categories
  const categories = [
    { name: 'Technologie', slug: 'technologie', color: '#3b82f6' },
    { name: 'Recenze', slug: 'recenze', color: '#22c55e' },
    { name: 'Návody', slug: 'navody', color: '#f59e0b' },
    { name: 'Novinky', slug: 'novinky', color: '#ef4444' },
    { name: 'Srovnání', slug: 'srovnani', color: '#8b5cf6' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Create tags
  const tagNames = [
    'AI', 'Software', 'Hardware', 'Mobilní telefony', 'Notebooky',
    'Smart Home', 'Bezpečnost', 'Produktivita', 'Linux', 'Windows',
  ];

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }

  // Create sample article
  const techCategory = await prisma.category.findUnique({ where: { slug: 'technologie' } });

  await prisma.article.upsert({
    where: { slug: 'vitejte-na-nasem-blogu' },
    update: {},
    create: {
      title: 'Vítejte na našem blogu',
      slug: 'vitejte-na-nasem-blogu',
      content: `
        <h2>Vítejte!</h2>
        <p>Toto je první článek na našem AI blogovém systému. Tento CMS vám umožňuje:</p>
        <ul>
          <li>Vytvářet články s pomocí AI</li>
          <li>Plánovat a automaticky publikovat obsah</li>
          <li>Spravovat affiliate odkazy</li>
          <li>Optimalizovat SEO</li>
        </ul>
        <h3>Jak začít?</h3>
        <p>Přihlaste se do administrace a začněte tvořit obsah. Systém vám pomůže s generováním článků,
        správou médií a optimalizací pro vyhledávače.</p>
      `,
      excerpt: 'Vítejte na našem AI blogovém systému. Zjistěte, co vám nabízí.',
      status: 'published',
      publishedAt: new Date(),
      metaTitle: 'Vítejte na našem blogu | AI Blog CMS',
      metaDescription: 'Představujeme náš moderní blogový systém s AI podporou pro tvorbu obsahu.',
      authorId: admin.id,
      categoryId: techCategory?.id,
    },
  });

  // Create sample affiliate partner
  await prisma.affiliatePartner.upsert({
    where: { id: 'sample-partner' },
    update: {},
    create: {
      id: 'sample-partner',
      name: 'Ukázkový partner',
      website: 'https://example.com',
      commission: '10%',
      notes: 'Ukázkový affiliate partner pro demonstraci.',
    },
  });

  // Create sample settings
  const settings = [
    { key: 'site_name', value: 'AI Blog CMS' },
    { key: 'site_description', value: 'Moderní blogový systém s AI podporou' },
    { key: 'posts_per_page', value: '12' },
    { key: 'default_language', value: 'cs' },
    { key: 'enable_comments', value: 'false' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
