const fs = require("fs");
const path = require("path");

const base64ToFile = (base64String, folder) => {
  if (!base64String || !base64String.includes(";base64,")) return base64String;
  
  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64String;

  const extension = matches[1] === 'png' ? 'png' : 'jpg';
  const buffer = Buffer.from(matches[2], "base64");
  
  const dir = path.join("uploads", folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  const filePath = path.join(dir, fileName);
  
  fs.writeFileSync(filePath, buffer);
  
  return `/uploads/${folder}/${fileName}`;
};

module.exports = {
  base64ToFile
};
