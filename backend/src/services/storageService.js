const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Calculates SHA-256 hash of a file
 */
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

/**
 * Malware scan simulator
 * In production this calls ClamAV or Microsoft Defender API.
 * Here we inspect headers, file size, and simulated test EICAR signatures.
 */
const scanForMalware = async (filePath, originalName) => {
  // Simulated scan delay
  await new Promise(r => setTimeout(r, 150));

  const lowerName = originalName.toLowerCase();
  // Check for dangerous extensions
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.scr'];
  const ext = path.extname(lowerName);

  if (dangerousExts.includes(ext)) {
    return {
      status: 'QUARANTINED',
      threatDetected: true,
      threatName: `Disallowed Executable / Script Pattern: ${ext}`,
      engine: 'SecOps-Defender-3.1',
      scannedAt: new Date().toISOString()
    };
  }

  // Read first 2KB to check for test strings
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.slice(0, 2048).toString();
    if (content.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
      return {
        status: 'QUARANTINED',
        threatDetected: true,
        threatName: 'EICAR Test Signature',
        engine: 'SecOps-Defender-3.1',
        scannedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[Storage] Buffer read check warning:', err.message);
  }

  return {
    status: 'CLEAN',
    threatDetected: false,
    threatName: null,
    engine: 'SecOps-Defender-3.1',
    scannedAt: new Date().toISOString()
  };
};

module.exports = {
  UPLOAD_DIR,
  calculateChecksum,
  scanForMalware
};

