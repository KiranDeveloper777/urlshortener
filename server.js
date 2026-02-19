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

// ==========================
// HOME PAGE
// ==========================
app.get("/", (req, res) => {
  res.send(`
    <h1>URL Shortener Microservice</h1>
    <h2>Short URL Creation</h2>
    <p>Example: POST [project_url]/api/shorturl - https://www.google.com</p>

    <form action="/api/shorturl" method="POST">
      <input type="text" name="url" placeholder="https://www.freecodecamp.org/" required>
      <button type="submit">Shorten URL</button>
    </form>

    <h3>Example Usage:</h3>
    <p>[this_project_url]/api/shorturl/1</p>
    <p>Will Redirect to:</p>
    <p>https://www.freecodecamp.org/</p>

    <hr>
    <p>By freeCodeCamp</p>
  `);
});

// ==========================
// CREATE SHORT URL
// ==========================
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  try {
    const parsedUrl = new URL(originalUrl);

    // Must be http or https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

    // Verify domain exists
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      const shortUrl = counter++;
      urlDatabase[shortUrl] = originalUrl;

      res.json({
        original_url: originalUrl,
        short_url: shortUrl,
      });
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

// ==========================
// REDIRECT
// ==========================
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (urlDatabase[shortUrl]) {
    return res.redirect(301, urlDatabase[shortUrl]);
  } else {
    return res.json({ error: "No short URL found" });
  }
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
