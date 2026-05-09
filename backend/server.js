import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3001;
const SHOP_URL = "https://slincraze.myspreadshop.no/all";

const SHOP_PAGES = [
  "https://slincraze.myspreadshop.no/all",
  "https://slincraze.myspreadshop.no/men",
  "https://slincraze.myspreadshop.no/women",
  "https://slincraze.myspreadshop.no/accessories",
  "https://slincraze.myspreadshop.no/kids-babies"
];

app.use(cors());

app.get("/api/products", async (req, res) => {
  try {
    const products = [];

    for (const pageUrl of SHOP_PAGES) {
      const response = await axios.get(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 SlinCrazeMerchBot/1.0"
        }
      });

      const $ = cheerio.load(response.data);

      $("img").each((_, element) => {
        const src =
          $(element).attr("src") ||
          $(element).attr("data-src") ||
          $(element).attr("data-original");

        const alt = $(element).attr("alt");

        if (!src || !alt) return;
        if (alt.length < 3) return;
        if (!alt.toLowerCase().includes("jatta") && !alt.toLowerCase().includes("slincraze")) return;

        const imageUrl = src.startsWith("http")
          ? src
          : src.startsWith("//")
            ? `https:${src}`
            : `${pageUrl}${src}`;

        products.push({
          name: alt.trim(),
          imageUrl,
          url: SHOP_URL,
          vibe: "SlinCraze merch"
        });
      });
    }

    const uniqueProducts = products.filter(
      (product, index, array) =>
        index === array.findIndex((p) => p.name === product.name)
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
  console.log(`Backend running on http://localhost:${PORT}`);
});