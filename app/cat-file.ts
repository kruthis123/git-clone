import fs from 'fs';
import * as fflate from 'fflate';

export default function executeCatFile(type: string, blobSha: string) {
  const inputPath = `./.git/objects/${blobSha.slice(0, 2)}/${blobSha.slice(2)}`;

  const compressedValue = new Uint8Array(fs.readFileSync(inputPath));
  const decompressedValue = fflate.decompressSync(compressedValue);
  const decodedValue = new TextDecoder().decode(decompressedValue);

  switch (type) {
    case '-t':
      process.stdout.write(decodedValue.split(' ')[0]);
      break;
    case '-s':
      process.stdout.write(decodedValue.split(' ')[1].split('\0')[0]);
      break;
    case '-p':
      const fileContent = decodedValue.substring(decodedValue.indexOf('\0') + 1);
      process.stdout.write(fileContent);
      break;
    default:
      process.stderr.write('Invalid type option');
  }
}