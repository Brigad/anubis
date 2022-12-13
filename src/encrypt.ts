import crypto from 'crypto';
import { EncryptCommand, KMSClient } from '@aws-sdk/client-kms';

import fs from 'fs';
import { AES_ALGORITHM } from './config';

import { decryptFile } from './decrypt';
import { addToGitignore } from './gitignore';
import { getFiles } from './args';
import { removeEncrypted } from './remove';

const kms = new KMSClient({});

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

  const encryptedKey = await kms.send(new EncryptCommand({Plaintext: Buffer.from(key.toString('hex')), KeyId: keyId}))

  const buffer = aes.update(content.toString());

  aes.final();

  fs.writeFileSync(
    `${file}.encrypted`,
    JSON.stringify({
      data: buffer.toString('hex'),
      key: Buffer.from(encryptedKey.CiphertextBlob!).toString('base64'),
      iv: iv.toString('hex'),
    }),
  );
  return [file, true];
};

export const encryptAll = async (patterns: string, keyId: string, clean: boolean, gitIgnorePath?: string) => {
  const {orignialFiles, newFiles, encryptedFiles} = await getFiles(patterns);

  const allConfigFiles = (await Promise.all(orignialFiles.map(f => encryptFile(f, keyId))));

  const encrypted = allConfigFiles.filter(e => !!e[1]);

  encrypted.map((e) => console.log(`=> ${e[0]}`));

  console.log(`\nEncrypted ${`new ${newFiles.length}`.green} and updated ${`${encrypted.length - newFiles.length}`.green} files (total : ${`${encryptedFiles.length + newFiles.length}`.green}).`);

  if (gitIgnorePath) {
    addToGitignore(gitIgnorePath, allConfigFiles.map(f => f[0]) as string[]);
  }

  if (clean) {
    await removeEncrypted(orignialFiles);
  }
};
