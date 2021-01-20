import { decrypt } from 'aws-kms-thingy';

import crypto from 'crypto';

import fs from 'fs';
import { AES_ALGORITHM } from './config';
import glob from 'fast-glob';

export const decryptFile = async (file: string, returnContent = false) => {
  const content = JSON.parse(fs.readFileSync(file).toString());

  const decrypted = await decrypt(content.key as string);

  const key = Buffer.from(decrypted, 'hex');
  const iv = Buffer.from(content.iv, 'hex');

  const aes = crypto.createDecipheriv(AES_ALGORITHM, key, iv);

  const buffer = aes.update(Buffer.from(content.data, 'hex'));

  aes.final();

  const decryptedContent = buffer.toString('utf8');

  if (returnContent) {
    return decryptedContent;
  }

  const targetFile = file.replace(/\.encrypted$/, '');

  try {
    const existingContent = fs.readFileSync(targetFile);

    if (existingContent.toString() === decryptedContent) {
      return null;
    }
  } catch { }

  fs.writeFileSync(targetFile, decryptedContent);

  return file;
};

export const decryptAll = async (pattern: string) => {
  const files = await glob([pattern.endsWith('.config.ts') ? pattern + '.encrypted' : pattern], {
    onlyFiles: true,
  });

  const decrypted = (await Promise.all(files.map((f) => decryptFile(f)))).filter((e) => !!e);

  decrypted.map((e) => console.log(`=> ${e}`));
  console.log(`\nDecrypted ${`${decrypted.length}`.green} / ${`${files.length}`.green} files.`);
};
