import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as fflate from 'fflate';

function createBlobObject(pathToFile: string) {
  const data = fs.readFileSync(pathToFile);
  const stringifiedData = data.toString();
  const inputToHash = `blob ${data.length}\0${stringifiedData}`;
  const hash = crypto.createHash('sha1').update(inputToHash).digest('hex');

  const buf = fflate.strToU8(inputToHash);
  const compressedValue = fflate.compressSync(buf);
  fs.mkdirSync(path.dirname(`.git1/objects/${hash.slice(0,2)}/${hash.slice(3)}`), { recursive: true });
  fs.writeFileSync(`.git1/objects/${hash.slice(0,2)}/${hash.slice(3)}`, compressedValue);

  return hash;
}

function getFileMode(filePath: string) {
  const stats = fs.statSync(filePath);

  if (stats.isDirectory()) {
      return '040000'; // Directory
  } else if (stats.isFile()) {
      // Check if the file is executable
      const isExecutable = (stats.mode & 0o111) !== 0; // Execute bits set
      return isExecutable ? '100755' : '100644';
  } else if (stats.isSymbolicLink()) {
      return '120000'; // Symbolic link
  } else {
      throw new Error(`Unsupported file type for path: ${filePath}`);
  }
}

export default async function executeWriteTree(dirname: string): Promise<string> {
  const objects: { mode: string; name: string; fileHash: string }[] = [];

  const files = await fs.promises.readdir(dirname);

  for (const file of files) {
    const fullPath = path.join(dirname, file);
    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      if (!['.git1', '.git', 'node_modules'].includes(file)) {
        const treeSha1Hash = await executeWriteTree(fullPath); // Recursive call
        objects.push({
          mode: getFileMode(fullPath), // Directory mode
          name: file,
          fileHash: treeSha1Hash,
        });
      }
    } else {
      const blobSha1Hash = createBlobObject(fullPath);
      objects.push({
        mode: getFileMode(fullPath), // File mode
        name: file,
        fileHash: blobSha1Hash,
      });
    }
  }

  // Sort objects by name
  objects.sort((a, b) => a.name.localeCompare(b.name));

  // Construct the tree content
  const fileContent = objects
    .map(object => `${object.mode} ${object.name}\0${Buffer.from(object.fileHash, 'hex')}`)
    .join('');

  const size = fileContent.length;
  const fileContentWithHeader = `tree ${size}\0${fileContent}`;

  // Calculate the SHA-1 hash
  const hash = crypto.createHash('sha1').update(fileContentWithHeader).digest('hex');

  // Compress and write to the `.git1/objects` directory
  const buf = fflate.strToU8(fileContentWithHeader);
  const compressedValue = fflate.compressSync(buf);
  const objectDir = `.git1/objects/${hash.slice(0, 2)}`;
  const objectPath = `${objectDir}/${hash.slice(2)}`;

  await fs.promises.mkdir(objectDir, { recursive: true });
  await fs.promises.writeFile(objectPath, compressedValue);

  return hash;
}