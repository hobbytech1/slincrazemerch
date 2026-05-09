import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.get("/", (req, res) => {
  res.send("SlinCraze backend running. Go to /api/products");
});

app.get("/api/products", (req, res) => {
  try {
    const filePath = path.join(__dirname, "products.json");
    const rawData = fs.readFileSync(filePath, "utf8");
    const products = JSON.parse(rawData);

    res.json(products);
  } catch (error) {
    console.error("Could not load products:", error.message);

    res.status(500).json({
      error: "Could not load products"
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