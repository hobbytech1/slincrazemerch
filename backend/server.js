import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("SlinCraze backend running");
});

app.get("/api/products", async (req, res) => {
  try {
    const rawData = fs.readFileSync(
      "./products.json",
      "utf8"
    );

    const products = JSON.parse(rawData);

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not load products"
    });
  }
});

app.get("/api/image-proxy", async (req, res) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res
        .status(400)
        .send("Missing image URL");
    }

    const response = await axios.get(
      imageUrl,
      {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0"
        }
      }
    );

    res.setHeader(
      "Content-Type",
      response.headers[
        "content-type"
      ] || "image/jpeg"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.send(response.data);
  } catch (error) {
    console.error(error);

    res
      .status(500)
      .send("Could not proxy image");
  }
});

app.listen(PORT, () => {
  console.log(
    `Backend running on port ${PORT}`
  );
});