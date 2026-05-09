import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3001;

const SHOP_URL = "https://slincraze.myspreadshop.no/all";

const SHOP_PAGES = [
  "https://slincraze.myspreadshop.no/all",
  "https://slincraze.myspreadshop.no"
];

app.use(cors());

app.get("/", (req, res) => {
  res.send("SlinCraze backend running. Go to /api/products");
});

async function scrapePage(pageUrl) {
  const response = await axios.get(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 SlinCrazeMerchBot/1.0"
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const products = [];

  $("img").each((_, element) => {
    const src =
      $(element).attr("src") ||
      $(element).attr("data-src") ||
      $(element).attr("data-original");

    const alt = $(element).attr("alt");

    if (!src || !alt) return;
    if (alt.length < 3) return;

    const lowerAlt = alt.toLowerCase();

    if (
      !lowerAlt.includes("jatta") &&
      !lowerAlt.includes("slincraze") &&
      !lowerAlt.includes("t-skjorte") &&
      !lowerAlt.includes("hoodie")
    ) {
      return;
    }

    const imageUrl = src.startsWith("http")
      ? src
      : src.startsWith("//")
        ? `https:${src}`
        : new URL(src, pageUrl).href;

    products.push({
      name: alt.trim(),
      imageUrl,
      url: SHOP_URL,
      vibe: "SlinCraze merch"
    });
  });

  return products;
}

app.get("/api/products", async (req, res) => {
  try {
    const results = await Promise.allSettled(
      SHOP_PAGES.map((pageUrl) => scrapePage(pageUrl))
    );

    const products = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const uniqueProducts = products.filter(
      (product, index, array) =>
        index === array.findIndex((p) => p.imageUrl === product.imageUrl)
    );

    res.json(uniqueProducts.slice(0, 50));
  } catch (error) {
    console.error("Product fetch failed:", error.message);

    res.status(500).json({
      error: "Could not fetch products"
    });
  }
});

app.get("/api/image-proxy", async (req, res) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).send("Missing image URL");
    }

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 SlinCrazeMerchBot/1.0"
      }
    });

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "image/jpeg"
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    res.send(response.data);
  } catch (error) {
    console.error("Image proxy failed:", error.message);
    res.status(500).send("Could not proxy image");
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});