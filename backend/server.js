import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";

const app = express();
const PORT = process.env.PORT || 3001;

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const GRAPH_VERSION = "v20.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEDULE_FILE = path.join(__dirname, "facebookSchedule.json");

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

function readSchedule() {
  if (!fs.existsSync(SCHEDULE_FILE)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeSchedule(posts) {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(posts, null, 2));
}

async function publishFacebookPost(post) {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error("Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN");
  }

  const hasImage = Boolean(post.imageUrl);

  const endpoint = hasImage
    ? `https://graph.facebook.com/${GRAPH_VERSION}/${FACEBOOK_PAGE_ID}/photos`
    : `https://graph.facebook.com/${GRAPH_VERSION}/${FACEBOOK_PAGE_ID}/feed`;

  const body = new URLSearchParams();
  body.append("access_token", FACEBOOK_PAGE_ACCESS_TOKEN);

  if (hasImage) {
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

app.post("/api/facebook/schedule", (req, res) => {
  const { caption, imageUrl, scheduledTime, productName } = req.body;

  if (!caption || !scheduledTime) {
    return res.status(400).json({
      error: "caption and scheduledTime are required"
    });
  }

  const posts = readSchedule();

  const newPost = {
    id: Date.now().toString(),
    caption,
    imageUrl: imageUrl || "",
    scheduledTime,
    productName: productName || "",
    status: "scheduled",
    createdAt: new Date().toISOString()
  };

  posts.push(newPost);
  writeSchedule(posts);

  res.json({
    success: true,
    post: newPost
  });
});

app.get("/api/facebook/schedule", (req, res) => {
  res.json(readSchedule());
});

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

cron.schedule(
  "* * * * *",
  async () => {
    const posts = readSchedule();
    const now = new Date();

    let changed = false;

    for (const post of posts) {
      if (post.status !== "scheduled") continue;

      const scheduledDate = new Date(post.scheduledTime);

      if (scheduledDate <= now) {
        try {
          const result = await publishFacebookPost(post);

          post.status = "posted";
          post.postedAt = new Date().toISOString();
          post.facebookResult = result;

          changed = true;
        } catch (error) {
          post.status = "failed";
          post.error = error.message;
          post.failedAt = new Date().toISOString();

          changed = true;
        }
      }
    }

    if (changed) {
      writeSchedule(posts);
    }
  },
  {
    timezone: "Europe/Oslo"
  }
);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});