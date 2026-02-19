require("dotenv").config();
const express = require("express");
const dns = require("dns");
const { URL } = require("url");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

// Home
app.get("/", (req, res) => {
  res.send("URL Shortener Microservice");
});

// Create Short URL
app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      // Check if exists
      const existing = await Url.findOne({ original_url: originalUrl });
      if (existing) {
        return res.json(existing);
      }

      // Get next ID safely
      const last = await Url.findOne().sort({ short_url: -1 });
      const nextId = last ? last.short_url + 1 : 1;

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: nextId,
      });

      await newUrl.save();

      res.json({
        original_url: originalUrl,
        short_url: nextId,
      });
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

// Redirect
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const found = await Url.findOne({ short_url: shortUrl });

  if (found) {
    return res.redirect(found.original_url);
  } else {
    return res.json({ error: "No short URL found" });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
