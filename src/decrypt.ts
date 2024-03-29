import crypto from 'crypto';
import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import fs from 'fs';
import { getFiles } from './args';
import { AES_ALGORITHM } from './config';

const kms = new KMSClient({});
const kmsDecrypt = async (ciphertext: string) => {
  const result = await kms.send(new DecryptCommand({CiphertextBlob: Buffer.from(ciphertext, 'base64')}));
  return result.Plaintext ? Buffer.from(result.Plaintext).toString('ascii') : ciphertext;
}

export const decryptFile = async (file: string, returnContent = false) => {
  const content = JSON.parse(fs.readFileSync(file).toString());
  const decrypted = await kmsDecrypt(content.key);

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

export const decryptAll = async (patterns: string) => {
  const {encryptedFiles} = await getFiles(patterns);

  const decrypted = (await Promise.all(encryptedFiles.map((f) => decryptFile(f)))).filter((e) => !!e);

  decrypted.map((e) => console.log(`=> ${e}`));
  console.log(`\nDecrypted ${`${decrypted.length}`.green} / ${`${encryptedFiles.length}`.green} files.`);
};
