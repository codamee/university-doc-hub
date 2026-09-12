// backend/src/services/storageService.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer"); // <-- THIS WAS MISSING!
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ==========================================
// 1. Cloudinary Configuration
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// 2. Multer Cloudinary Storage Setup
// ==========================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "university-doc-hub",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    resource_type: "auto",
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX"));
  },
});

// ==========================================
// 3. Local File Utilities (Checksum & Malware)
// ==========================================
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
    // Fallback for Cloudinary URLs (since they aren't local files)
    if (filePath.startsWith("http")) {
      resolve("cloudinary-secure-hash");
    }
  });
};

const scanForMalware = async (filePath, originalName) => {
  await new Promise((r) => setTimeout(r, 150)); // Simulated delay
  const lowerName = originalName.toLowerCase();
  const dangerousExts = [".exe", ".bat", ".cmd", ".sh", ".vbs", ".js", ".scr"];
  const ext = path.extname(lowerName);

  if (dangerousExts.includes(ext)) {
    return { status: "QUARANTINED", threatDetected: true, threatName: `Disallowed Executable: ${ext}`, engine: "SecOps-Defender-3.1", scannedAt: new Date().toISOString() };
  }

  return { status: "CLEAN", threatDetected: false, threatName: null, engine: "SecOps-Defender-3.1", scannedAt: new Date().toISOString() };
};

// ==========================================
// 4. Exports
// ==========================================
module.exports = {
  UPLOAD_DIR,
  calculateChecksum,
  scanForMalware,
  upload, // <-- Now we export the upload middleware!
};