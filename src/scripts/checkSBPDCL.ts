import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    console.log("Fetching SBPDCL outage page...");
    const response = await axios.get(
      "https://www.sbpdcl.co.in/frmDisplayPowerOutageO.aspx",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);

    console.log("Page title:", $("title").text());
    console.log("Status:", response.status);

    // Print all table rows to see the structure
    $("table tr").slice(0, 5).each((i, row) => {
      const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
      if (cells.length > 0) {
        console.log(`Row ${i}:`, cells);
      }
    });

  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

main();