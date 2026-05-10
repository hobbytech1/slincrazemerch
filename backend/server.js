import express from "express";
import cors from "cors";
import fs from "fs";
import cron from "node-cron";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3001;

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

const GRAPH_VERSION = "v20.0";
const SCHEDULE_FILE = "./facebookSchedule.json";

const products = [
  {
    name: "SlinCraze Merch",
    vibe: "Official merch",
    url: "https://slincraze.myspreadshop.no",
    imageUrl: "https://image.spreadshirtmedia.net/image-server/v1/compositions/T210A2PA4301PT17X40Y34D1038452155W25000H25000/views/1,width=1200,height=1200,appearanceId=2,backgroundColor=F2F2F2/no-minimum.jpg"
  }
];

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

app.get("/", (req, res) => {
  res.json({
    status: "SlinCraze Merch backend running"
  });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/image-proxy", async (req, res) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).json({ error: "Missing image url" });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(500).json({ error: "Could not fetch image" });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/api/facebook/schedule", (req, res) => {
  res.json(readSchedule());
});

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
    productName: productName || "",
    scheduledTime,
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
  console.log(`Server running on port ${PORT}`);
});