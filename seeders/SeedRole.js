const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = ["Admin", "User", "Vendor"];

  for (const roleName of roles) {
    const role = await prisma.rolemaster.upsert({
      where: {role: roleName},
      update: {},
      create: {role: roleName},
    });

    console.log(`✅ Role '${roleName}' seeded.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error seeding roles:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
