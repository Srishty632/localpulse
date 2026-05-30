import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const response = await axios.get(
    "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
    {
      params: {
        "api-key": process.env.CPCB_API_KEY,
        format: "json",
        "filters[city]": "Patna",
        limit: 3,
      },
    }
  );

  console.log("First record:");
  console.log(JSON.stringify(response.data.records[0], null, 2));
}

main();