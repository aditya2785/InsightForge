import { prisma } from "../lib/prisma";

async function main() {
  await prisma.forecast.deleteMany({});
  await prisma.businessHealthScore.deleteMany({});
  await prisma.uploadedData.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });