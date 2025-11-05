const {PrismaClient} = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin", 10); // change password as needed

  // Find role "Admin"
  const role = await prisma.rolemaster.findFirst({
    where: {role: "Admin"},
  });

  if (!role) {
    throw new Error('⚠️ Role "Admin" not found in rolemaster table');
  }

  // Upsert admin user
  const admin = await prisma.users.upsert({
    where: {email: "brijesh@gmail.com"},
    update: {}, // don't overwrite existing user
    create: {
      role_id: role.id,
      email: "brijesh@gmail.com",
      password: hashedPassword,
      fullname: "Admin",
      phone_number: "",
      status: true,
    },
  });

  console.log("✅ Admin user seeded:", admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding admin:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
