import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data", "eczema-data.json");

if (!existsSync(join(__dirname, "data"))) {
  mkdirSync(join(__dirname, "data"));
}

if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ startDate: null, days: {} }, null, 2));
}

const photosDir = join(__dirname, "data/photos");
if (!existsSync(photosDir)) mkdirSync(photosDir);

const upload = multer({
  storage: multer.diskStorage({
    destination: photosDir,
    filename: (req, file, cb) =>
      cb(null, `day-${req.params.day}-${Date.now()}${extname(file.originalname)}`),
  }),
});

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
app.use("/photos", express.static(photosDir));

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

app.post("/api/day/:day/photo", upload.single("photo"), (req, res) => {
  const data = readData();
  if (!data.days[req.params.day]) {
    data.days[req.params.day] = { photos: [] };
  }
  if (!data.days[req.params.day].photos) {
    data.days[req.params.day].photos = [];
  }
  data.days[req.params.day].photos.push(req.file.filename);
  writeData(data);
  res.json({ filename: req.file.filename });
});

app.delete("/api/day/:day/photo/:filename", (req, res) => {
  const { day, filename } = req.params;
  const filePath = join(photosDir, filename);
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch {}
  const data = readData();
  if (data.days[day]?.photos) {
    data.days[day].photos = data.days[day].photos.filter(f => f !== filename);
  }
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
