import { encrypt } from 'aws-kms-thingy';

import crypto from 'crypto';

import fs from 'fs';
import { AES_ALGORITHM } from './config';

import { decryptFile } from './decrypt';
import glob from 'fast-glob';

export const encryptFile = async (file: string, keyId: string) => {

  const content = fs.readFileSync(file);

  try {
    const decryptedContent = await decryptFile(`${file}.encrypted`, true);

    if (content.toString() === decryptedContent) {
      return null;
    }
  } catch { }
  const key = Buffer.from(crypto.randomBytes(32));
  const iv = Buffer.from(crypto.randomBytes(16));

  const aes = crypto.createCipheriv(AES_ALGORITHM, key, iv);

  const encryptedKey = await encrypt({
    plaintext: key.toString('hex'),
    keyId,
  });

  const buffer = aes.update(content.toString());

  aes.final();

  fs.writeFileSync(
    `${file}.encrypted`,
    JSON.stringify({
      data: buffer.toString('hex'),
      key: encryptedKey,
      iv: iv.toString('hex'),
    }),
  );
  return file;
};

export const encryptAll = async (pattern: string, keyId: string) => {
  const files = await glob([pattern.endsWith('.config.ts.encrypted') ? pattern.replace(/\.encrypted$/, '') : pattern], {
    onlyFiles: true,
  });

  const encrypted = (await Promise.all(files.map(f => encryptFile(f, keyId)))).filter((e) => !!e);

  encrypted.map((e) => console.log(`=> ${e}`));
  console.log(`\nEncrypted ${`${encrypted.length}`.green} / ${`${files.length}`.green} files.`);
};