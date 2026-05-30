import { fetchAndStoreAirQuality } from "@/lib/fetchers/airQuality";
import { prisma } from "@/lib/prisma";

async function main() {
  await fetchAndStoreAirQuality();

  const readings = await prisma.airQualityReading.findMany({
    include: { station: true },
    orderBy: { recordedAt: "desc" },
    take: 5,
  });

  console.log("\n--- Latest readings in DB ---");
  for (const r of readings) {
    console.log(`${r.station.name}: AQI=${r.aqi}, PM2.5=${r.pm25}, PM10=${r.pm10}`);
  }

  await prisma.$disconnect();
}

main();