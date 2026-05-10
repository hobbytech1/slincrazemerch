import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

const GRAPH_VERSION = "v20.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

app.get("/api/slincraze/random-image", async (req, res) => {
  try {
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      return res.status(500).json({
        error: "Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID"
      });
    }

    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: GOOGLE_SEARCH_API_KEY,
          cx: GOOGLE_SEARCH_ENGINE_ID,
          q: "SlinCraze",
          searchType: "image",
          num: 10,
          safe: "active"
        },
        timeout: 30000
      }
    );

    const images = response.data.items || [];

    if (images.length === 0) {
      return res.status(404).json({
        error: "No SlinCraze images found",
        googleResponse: response.data
      });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];

    res.json({
      title: randomImage.title,
      imageUrl: randomImage.link,
      thumbnail: randomImage.image?.thumbnailLink,
      sourceUrl: randomImage.image?.contextLink
    });
  } catch (error) {
    console.error("Random SlinCraze image failed:", error.response?.data || error.message);

    res.status(500).json({
      error: "Could not fetch random SlinCraze image",
      details: error.response?.data || error.message
    });
  }
});

async function publishFacebookPost(post) {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error("Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN");
  }

  const endpoint = post.imageUrl
    ? `https://graph.facebook.com/${GRAPH_VERSION}/${FACEBOOK_PAGE_ID}/photos`
    : `https://graph.facebook.com/${GRAPH_VERSION}/${FACEBOOK_PAGE_ID}/feed`;

  const body = new URLSearchParams();
  body.append("access_token", FACEBOOK_PAGE_ACCESS_TOKEN);

  if (post.imageUrl) {
    body.append("url", post.imageUrl);
    body.append("caption", post.caption || "");
  } else {
    body.append("message", post.caption || "");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

app.post("/api/facebook/publish-now", async (req, res) => {
  try {
    const { caption, imageUrl, productName } = req.body;

    if (!caption) {
      return res.status(400).json({
        success: false,
        error: "Caption is required"
      });
    }

    const result = await publishFacebookPost({
      caption,
      imageUrl,
      productName
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Facebook publish failed:", error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});