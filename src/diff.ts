import { diffChars } from 'diff';
import { decryptFile } from './decrypt';
import fs from 'fs';
import { getFiles } from './args';
import { getObjectDiff } from './utils';

const printDiff = (contentA, contentB) => {
  const diff = diffChars(contentA, contentB);

  diff.forEach((part) => {
    // eslint-disable-next-line no-nested-ternary
    const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
    process.stderr.write(part.value[color]);
  });
  console.log();
};

export const diffFile = async (file, writeOutput = true) => {
  if (!file.endsWith('.encrypted')) {
    file = file + '.encrypted';
  }

  let decryptedContent: string | null = null;
  try {
    decryptedContent = await decryptFile(file, true);
  } catch { }

  const targetFile = file.replace(/\.encrypted$/, '');

  try {
    const existingContent = fs.readFileSync(targetFile).toString();

    if (writeOutput) {
      if (!decryptedContent) {
        console.log('\nThe file was never encrypted before.'.red);
      } else if (existingContent === decryptedContent) {
        console.log('\nNo change detected.'.green);
        return null;
      } else {
        printDiff(decryptedContent, existingContent);
      }
      return file;
    }

    if (existingContent === decryptedContent) {
      return null;
    }

  } catch { }

  if (writeOutput) {
    if (!decryptedContent) {
      console.log('\nNot found'.red);
    } else {
      console.log('\nThere is no local version of the decrypted file'.red);
    }
  }

  return file;
};

export const diffList = async (patterns: string) => {
  const {encryptedFiles, orignialFiles} = await getFiles(patterns);

  const toEncryptFiles = orignialFiles.filter((f) => !encryptedFiles.includes(`${f}.encrypted`));

  const diff = (await Promise.all(encryptedFiles.map((f) => diffFile(f, false)))).filter((e) => !!e);

  diff.map((e) => console.log(`${'Updated'.cyan} => ${e.replace(/\.encrypted$/, '')}`));
  toEncryptFiles.map((e) => console.log(`${'New'.green} => ${e}`));

  console.log(
    `\nFound differences on ${diff.length} / ${encryptedFiles.length} files and ${toEncryptFiles.length} new file to encrypt`,
  );
};

export const compareEncryptedFiles = async (originalFile, fileToCompare) => {
  if (!originalFile.endsWith(".encrypted")) {
    originalFile = originalFile + ".encrypted";
  }
  if (!fileToCompare.endsWith(".encrypted")) {
    fileToCompare = fileToCompare + ".encrypted";
  }

  console.log(originalFile, fileToCompare);

  let decryptedOriginal: string | null = null;
  let decryptedToCompare: string | null = null;
  try {
    decryptedOriginal = await decryptFile(originalFile, true);
    decryptedToCompare = await decryptFile(fileToCompare, true);
  } catch {}

  if (!decryptedOriginal) {
    console.log("\nSrc not found".red);
    return null;
  }

  if (!decryptedToCompare) {
    console.log("\nDest not found".red);
    return null;
  }

  const decryptedContentAsJSON = eval(decryptedOriginal);
  const existingContentAsJSON = eval(decryptedToCompare);

  const diff = getObjectDiff(existingContentAsJSON, decryptedContentAsJSON);
  console.log(diff);
  return originalFile;
};