import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as fflate from 'fflate';

export default function executeHashObject(filename: string, writeFile: boolean = false) {
  const pathToFile = path.resolve(filename);
  const data = fs.readFileSync(pathToFile);
  const stringifiedData = data.toString();
  const inputToHash = `blob ${data.length}\0${stringifiedData}`;
  const hash = crypto.createHash('sha1').update(inputToHash).digest('hex');
  process.stdout.write(hash);

  if (writeFile) {
    const buf = fflate.strToU8(inputToHash);
    const compressedValue = fflate.compressSync(buf);
    fs.mkdirSync(path.dirname(`.git/objects/${hash.slice(0,2)}/${hash.slice(3)}`), { recursive: true });
    fs.writeFileSync(`.git/objects/${hash.slice(0,2)}/${hash.slice(3)}`, compressedValue);
  }
}