import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create superadmin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@sportobjednavky.cz" },
    update: {},
    create: {
      email: "admin@sportobjednavky.cz",
      password: await bcrypt.hash("admin123", 12),
      name: "Super Admin",
      isSuperAdmin: true,
    },
  });

  // Create demo club admin
  const clubAdmin = await prisma.user.upsert({
    where: { email: "trener@sokol.cz" },
    update: {},
    create: {
      email: "trener@sokol.cz",
      password: await bcrypt.hash("trener123", 12),
      name: "Jan Novotný",
      isSuperAdmin: false,
    },
  });

  // Create demo club
  const club = await prisma.club.upsert({
    where: { slug: "fk-sokol-brno" },
    update: {},
    create: {
      name: "FK Sokol Brno",
      slug: "fk-sokol-brno",
      contactEmail: "trener@sokol.cz",
      contactPhone: "+420 777 123 456",
      ico: "12345678",
      address: "Sportovní 123, 602 00 Brno",
      isActive: true,
      ordersOpen: true,
    },
  });

  // Add club membership
  await prisma.clubMembership.upsert({
    where: { userId_clubId: { userId: clubAdmin.id, clubId: club.id } },
    update: {},
    create: {
      userId: clubAdmin.id,
      clubId: club.id,
      role: "ADMIN",
    },
  });

  // Create categories
  const categories = [
    { name: "U8 - Přípravka", sortOrder: 1 },
    { name: "U10 - Mladší žáci", sortOrder: 2 },
    { name: "U12 - Starší žáci", sortOrder: 3 },
    { name: "U14 - Dorostenci", sortOrder: 4 },
    { name: "U16 - Junioři", sortOrder: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { clubId_name: { clubId: club.id, name: cat.name } },
      update: {},
      create: {
        clubId: club.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });
  }

  // Create products
  const products = [
    {
      name: "Dresové tričko",
      description: "Pohodlné dresové tričko z prodyšného materiálu s logem klubu. Ideální pro tréninky i zápasy.",
      price: 350,
      sizes: JSON.stringify(["XS", "M", "L", "XL"]),
      imageUrl: "/images/default-tshirt.svg",
      sortOrder: 1,
    },
    {
      name: "Sportovní kraťasy",
      description: "Lehké sportovní kraťasy s elastickým pasem a bočními kapsami. Rychleschnoucí materiál.",
      price: 420,
      sizes: JSON.stringify(["XS", "M", "L", "XL"]),
      imageUrl: "/images/default-shorts.svg",
      sortOrder: 2,
    },
    {
      name: "Tréninkové tepláky",
      description: "Zateplené tréninkové tepláky s manžetami. Vhodné pro chladnější počasí a halové tréninky.",
      price: 650,
      sizes: JSON.stringify(["XS", "M", "L", "XL"]),
      imageUrl: "/images/default-pants.svg",
      sortOrder: 3,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { clubId: club.id, name: product.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          clubId: club.id,
          ...product,
        },
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log("---");
  console.log("Superadmin: admin@sportobjednavky.cz / admin123");
  console.log("Trenér:     trener@sokol.cz / trener123");
  console.log("Demo klub:  FK Sokol Brno (fk-sokol-brno)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
