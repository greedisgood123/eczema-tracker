import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data", "eczema-data.json");

if (!existsSync(join(__dirname, "data"))) {
  mkdirSync(join(__dirname, "data"));
}

if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ startDate: null, days: {} }, null, 2));
}

function readData() {
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { startDate: null, days: {} };
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(express.json());

const distPath = join(__dirname, "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get("/api/data", (req, res) => {
  res.json(readData());
});

app.post("/api/start-date", (req, res) => {
  const { date } = req.body;
  const data = readData();
  data.startDate = date;
  writeData(data);
  res.json({ ok: true });
});

app.get("/api/day/:day", (req, res) => {
  const data = readData();
  const entry = data.days[req.params.day] || null;
  res.json(entry);
});

app.post("/api/day/:day", (req, res) => {
  const data = readData();
  data.days[req.params.day] = req.body;
  writeData(data);
  res.json({ ok: true });
});

if (existsSync(distPath)) {
  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Eczema Tracker running at http://localhost:${PORT}`);
});
