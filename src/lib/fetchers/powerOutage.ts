import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { parse } from "date-fns";

const SBPDCL_URL = "https://www.sbpdcl.co.in/frmDisplayPowerOutageO.aspx";

export async function fetchAndStorePowerOutages() {
  console.log("Fetching power outage data...");

  try {
    const response = await axios.get(SBPDCL_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Check if no records
    const pageText = $("body").text();
    if (pageText.includes("No Records Found")) {
      console.log("No scheduled outages found on SBPDCL today.");
      await prisma.scraperLog.create({
        data: {
          source: "SBPDCL",
          status: "success",
          message: "No scheduled outages today",
        },
      });
      return;
    }

    // Find the main data table
    const outages: any[] = [];

    $("table tr").each((i, row) => {
      const cells = $(row)
        .find("td")
        .map((_, td) => $(td).text().trim())
        .get()
        .filter((cell) => cell.length > 0);

      // Skip header rows and empty rows
      if (cells.length < 4) return;
      if (cells[0].toLowerCase().includes("sl") || cells[0].toLowerCase().includes("date")) return;

      // Try to parse outage row — format varies but typically:
      // [date, area/feeder, start time, end time, reason]
      const rawDate = cells[0];
      const area = cells[1] || "Unknown Area";
      const startTimeRaw = cells[2] || "";
      const endTimeRaw = cells[3] || "";
      const reason = cells[4] || "Scheduled maintenance";

      try {
        // Parse dates — SBPDCL uses DD/MM/YYYY or DD-MM-YYYY
        const dateStr = rawDate.replace(/-/g, "/");
        const startStr = `${dateStr} ${startTimeRaw}`;
        const endStr = `${dateStr} ${endTimeRaw}`;

        let startTime: Date;
        let endTime: Date;

        try {
          startTime = parse(startStr, "dd/MM/yyyy HH:mm", new Date());
          endTime = parse(endStr, "dd/MM/yyyy HH:mm", new Date());
        } catch {
          startTime = new Date();
          endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
        }

        if (isNaN(startTime.getTime())) {
          startTime = new Date();
          endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
        }

        outages.push({ area, startTime, endTime, reason });
      } catch {
        // Skip unparseable rows
      }
    });

    if (outages.length === 0) {
      console.log("Page loaded but no parseable outage data found.");
      await prisma.scraperLog.create({
        data: {
          source: "SBPDCL",
          status: "success",
          message: "Page loaded, no parseable outages",
        },
      });
      return;
    }

    // Save to DB
    for (const outage of outages) {
      await prisma.powerOutage.create({
        data: {
          area: outage.area,
          startTime: outage.startTime,
          endTime: outage.endTime,
          reason: outage.reason,
          isScheduled: true,
          isActive: true,
          sourceUrl: SBPDCL_URL,
        },
      });
      console.log(`✓ Saved outage: ${outage.area}`);
    }

    await prisma.scraperLog.create({
      data: {
        source: "SBPDCL",
        status: "success",
        message: `Saved ${outages.length} outages`,
      },
    });

  } catch (error: any) {
    console.error("SBPDCL scraper error:", error.message);
    await prisma.scraperLog.create({
      data: {
        source: "SBPDCL",
        status: "error",
        message: error.message,
      },
    });
  }
}