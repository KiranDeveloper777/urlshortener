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

// ===============================
// MongoDB Connection
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ===============================
// Schema
// ===============================
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

// ===============================
// FCC STYLE HOME PAGE
// ===============================
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>URL Shortener Microservice</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          text-align: center;
          margin-top: 50px;
        }
        .container {
          background: white;
          padding: 30px;
          width: 500px;
          margin: auto;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        input {
          padding: 10px;
          width: 80%;
          margin: 10px 0;
        }
        button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 5px;
        }
        button:hover {
          background: #0056b3;
        }
        hr {
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>URL Shortener Microservice</h1>

        <h3>Short URL Creation</h3>
        <p>Example: POST [project_url]/api/shorturl - https://www.google.com</p>

        <form action="/api/shorturl" method="POST">
          <input type="text" name="url" placeholder="https://www.freecodecamp.org/" required />
          <br>
          <button type="submit">Shorten URL</button>
        </form>

        <hr>

        <h3>Example Usage:</h3>
        <p>[this_project_url]/api/shorturl/1</p>

        <p>Will Redirect to:</p>
        <p>https://www.freecodecamp.org/</p>

        <hr>
        <p>By freeCodeCamp</p>
      </div>
    </body>
    </html>
  `);
});

// ===============================
// CREATE SHORT URL
// ===============================
app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    // Must be http or https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      // Check if already exists
      const existing = await Url.findOne({ original_url: originalUrl });
      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url,
        });
      }

      // Generate next numeric ID safely
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

// ===============================
// REDIRECT
// ===============================
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const found = await Url.findOne({ short_url: shortUrl });

  if (found) {
    return res.redirect(found.original_url);
  } else {
    return res.json({ error: "No short URL found" });
  }
});

// ===============================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
