/* คัดลอก Blockly จาก node_modules มาไว้ใน vendor/blockly เพื่อเลิกพึ่ง CDN
 *   npm install && npm run vendor:blockly
 * เสร็จแล้วแก้ src ของสอง <script> ใน index.html ให้ชี้มาที่
 *   vendor/blockly/blockly.min.js และ vendor/blockly/msg/th.js
 */
import { mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FROM = join(ROOT, 'node_modules', 'blockly');
const TO = join(ROOT, 'vendor', 'blockly');

try {
  await access(FROM);
} catch {
  console.error('ไม่พบ node_modules/blockly — รัน npm install ก่อน');
  process.exit(1);
}

await mkdir(join(TO, 'msg'), { recursive: true });
for (const [src, dest] of [
  ['blockly.min.js', 'blockly.min.js'],
  ['msg/th.js', 'msg/th.js'],
  ['LICENSE', 'LICENSE.txt'],
]) {
  await copyFile(join(FROM, src), join(TO, dest));
  console.log('คัดลอก', src);
}
console.log('\nเสร็จแล้ว — อย่าลืมแก้ src ของ <script> สองบรรทัดใน index.html');
console.log('และเอา vendor/blockly ออกจาก .gitignore ถ้าต้องการคอมมิตลงรีโป');
