import fs from 'fs';
import * as fflate from 'fflate';

export default function executeLsTree(treeSha: string, nameOnly: boolean = false) {
  const pathToFile = `./.git1/objects/${treeSha.slice(0,2)}/${treeSha.slice(2)}`;
  const compressedValue = new Uint8Array(fs.readFileSync(pathToFile));
  const decompressedValue = fflate.decompressSync(compressedValue);
  const decodedValue = new TextDecoder().decode(decompressedValue);

  if (nameOnly) {
    const objectArray = decodedValue.split('\0');
    for (let i = 1; i < objectArray.length; i++) {
      const fileName = objectArray[i].split(' ')[1];
      if (fileName) {
        console.log(fileName);
      }
    }
  } else {
    const fileContent = decompressedValue.subarray(decompressedValue.indexOf(0) + 1);

    let offset = 0;
    let nullIndex, spaceIndex;
    while (offset < fileContent.length) {
      spaceIndex = fileContent.indexOf(0x20, offset);
      const mode = new TextDecoder().decode(fileContent.subarray(offset, spaceIndex));
      offset = spaceIndex + 1;

      nullIndex = fileContent.indexOf(0, offset);
      const name = new TextDecoder().decode(fileContent.subarray(offset, nullIndex));
      offset = nullIndex + 1;

      const sha1Hash = Buffer.from(fileContent.subarray(offset, offset + 20)).toString('hex');
      offset = offset + 20;

      const pathToFile = `./.git/objects/${sha1Hash.slice(0,2)}/${sha1Hash.slice(2)}`;
      const compressedValue = new Uint8Array(fs.readFileSync(pathToFile));
      const decompressedValue = fflate.decompressSync(compressedValue);
      const decodedValue = new TextDecoder().decode(decompressedValue);
      const type = decodedValue.split(' ')[0];

      console.log(`${mode.padStart(6, '0')} ${type} ${sha1Hash}    ${name}`);
    }
  }
}