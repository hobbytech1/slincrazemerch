import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3001;

const SHOP_URL = "https://slincraze.myspreadshop.no/all";

app.use(cors());

app.get("/", (req, res) => {
  res.send("SlinCraze backend running. Go to /api/products");
});

async function scrapeWithPuppeteer() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 SlinCrazeMerchBot/1.0"
    );

    await page.goto(SHOP_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Scroll ned flere ganger for lazy-loaded produkter
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const products = await page.evaluate(() => {
      const items = [];
      const images = document.querySelectorAll("img");

      images.forEach((img) => {
        const src =
          img.src ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-original");

        const alt = img.alt;

        if (!src || !alt) return;
        if (alt.length < 3) return;

        const lowerAlt = alt.toLowerCase();

        if (
          !lowerAlt.includes("jatta") &&
          !lowerAlt.includes("slincraze") &&
          !lowerAlt.includes("t-skjorte") &&
          !lowerAlt.includes("hoodie") &&
          !lowerAlt.includes("premium") &&
          !lowerAlt.includes("økologisk")
        ) {
          return;
        }

        items.push({
          name: alt.trim(),
          imageUrl: src,
          url: "https://slincraze.myspreadshop.no/all",
          vibe: "SlinCraze merch"
        });
      });

      return items;
    });

    return products;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeWithCheerioFallback() {
  const response = await axios.get(SHOP_URL, {
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

    const imageUrl = src.startsWith("http")
      ? src
      : src.startsWith("//")
        ? `https:${src}`
        : new URL(src, SHOP_URL).href;

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
    let products = [];

    try {
      products = await scrapeWithPuppeteer();
    } catch (error) {
      console.error("Puppeteer failed, using fallback:", error.message);
      products = await scrapeWithCheerioFallback();
    }

    const uniqueProducts = products.filter(
      (product, index, array) =>
        index === array.findIndex((p) => p.imageUrl === product.imageUrl)
    );

    res.json(uniqueProducts.slice(0, 100));
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
      },
      timeout: 30000
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