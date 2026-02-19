const express = require("express");
const dns = require("dns");
const { URL } = require("url");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// In-memory storage
let urlDatabase = {};
let counter = 1;

// Home Route
app.get("/", (req, res) => {
  res.send("URL Shortener Microservice");
});

// POST: Create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    // Check protocol (must be http or https)
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

    // DNS lookup to verify domain
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      const shortUrl = counter;
      urlDatabase[shortUrl] = originalUrl;
      counter++;

      res.json({
        original_url: originalUrl,
        short_url: shortUrl,
      });
    });
  } catch (error) {
    res.json({ error: "invalid url" });
  }
});

// GET: Redirect
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.json({ error: "No short URL found" });
  }

  res.redirect(originalUrl);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
