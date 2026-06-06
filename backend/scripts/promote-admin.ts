import { prisma } from "../src/database/prisma.js";
import { normalizeEmail } from "../src/utils/normalize-email.js";

async function main() {
  const email = process.argv[2];

  if (!email) {
    throw new Error("Usage: npm run admin:promote -- email@example.com");
  }

  const emailNormalized = normalizeEmail(email);
  const user = await prisma.user.update({
    where: {
      emailNormalized
    },
    data: {
      role: "ADMIN"
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  console.log(`User ${user.email} promoted to ${user.role}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
