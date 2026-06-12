const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "..", "public")));

// API Routes
app.use("/api", require("./routes/api"));

// Serve SPA - all non-API routes go to index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.get("/pages/:page", (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, "..", "public", "pages", page));
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("✅ AI Toolbox Server running on http://0.0.0.0:" + PORT);
    console.log("📝 Wallet address: " + require("./services/wallet").getAddress());
});

module.exports = app;
