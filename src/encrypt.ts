import { encrypt } from 'aws-kms-thingy';

import crypto from 'crypto';

import fs from 'fs';
import { AES_ALGORITHM } from './config';

import { decryptFile } from './decrypt';
import glob from 'fast-glob';
import { addToGitignore } from './clean-github';

export const encryptFile = async (file: string, keyId: string) => {

  const content = fs.readFileSync(file);

  try {
    const decryptedContent = await decryptFile(`${file}.encrypted`, true);

    if (content.toString() === decryptedContent) {
      return [file, false];
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
  return [file, true];
};

export const encryptAll = async (patterns: string, keyId: string, gitIgnorePath?: string) => {
  const files = await glob(patterns.split(',').map(p => p.endsWith('.encrypted') ? p.replace(/\.encrypted$/, '') : p), {
    onlyFiles: true,
  });

  const allConfigFiles = (await Promise.all(files.map(f => encryptFile(f, keyId))));

  const encrypted = allConfigFiles.filter(e => !!e[1]);

  encrypted.map((e) => console.log(`=> ${e[0]}`));

  console.log(`\nEncrypted ${`${encrypted.length}`.green} / ${`${allConfigFiles.length}`.green} files.`);

  if (gitIgnorePath) {
    addToGitignore(gitIgnorePath, allConfigFiles.map(f => f[0]) as string[]);
  }
};