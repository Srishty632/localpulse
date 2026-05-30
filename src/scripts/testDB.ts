import { prisma } from "../lib/prisma";

async function main() {
  console.log("Testing database connection...");
  
  await prisma.scraperLog.create({
    data: {
      source: "TEST",
      status: "success",
      message: "Day 1 complete — database connected!",
    },
  });

  const logs = await prisma.scraperLog.findMany();
  console.log("DB is working! Logs:", logs);
  
  await prisma.$disconnect();
}

main();