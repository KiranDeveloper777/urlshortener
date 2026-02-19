const express = require("express");
const dns = require("dns");
const { URL } = require("url");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let urlDatabase = {};
let counter = 1;

// Home
app.get("/", (req, res) => {
  res.send("URL Shortener Microservice");
});

// POST
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  try {
    const parsedUrl = new URL(originalUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      // Save URL
      const shortUrl = counter;
      urlDatabase[shortUrl] = originalUrl;
      counter++;

      res.json({
        original_url: originalUrl,
        short_url: shortUrl,
      });
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

// Redirect
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (urlDatabase[shortUrl]) {
    res.redirect(301, urlDatabase[shortUrl]); // 301 is important for FCC
  } else {
    res.json({ error: "No short URL found" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
