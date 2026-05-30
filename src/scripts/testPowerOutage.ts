import { fetchAndStorePowerOutages } from "@/lib/fetchers/powerOutage";
import { prisma } from "@/lib/prisma";

async function main() {
  await fetchAndStorePowerOutages();

  const outages = await prisma.powerOutage.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const logs = await prisma.scraperLog.findMany({
    where: { source: "SBPDCL" },
    orderBy: { runAt: "desc" },
    take: 3,
  });

  console.log("\n--- Outages in DB ---");
  console.log(outages.length > 0 ? outages : "No outages stored (none scheduled today)");
  
  console.log("\n--- Scraper logs ---");
  console.log(logs);

  await prisma.$disconnect();
}

main();