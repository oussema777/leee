import fs from 'fs';
import path from 'path';

const srcDir = 'public/images/The spark';
const destDir = 'public/images/spark';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
const jpgs = files.filter(f => f.endsWith('.jpg'));
const mp4s = files.filter(f => f.endsWith('.mp4'));

// Copy and rename JPGs
jpgs.forEach((file, i) => {
  const num = String(i + 1).padStart(2, '0');
  const dest = path.join(destDir, `spark-${num}.jpg`);
  fs.copyFileSync(path.join(srcDir, file), dest);
  console.log(`Copied: ${file.substring(0, 40)}... -> spark-${num}.jpg`);
});

// Copy and rename MP4s
mp4s.forEach((file, i) => {
  const num = String(i + 1).padStart(2, '0');
  const dest = path.join(destDir, `spark-video-${num}.mp4`);
  fs.copyFileSync(path.join(srcDir, file), dest);
  console.log(`Copied: ${file.substring(0, 40)}... -> spark-video-${num}.mp4`);
});

console.log(`\nDone! ${jpgs.length} photos + ${mp4s.length} videos copied to ${destDir}`);
