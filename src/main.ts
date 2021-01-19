#!/usr/bin/env node
/* eslint-disable no-empty */

import 'colors';

import { encrypt, decrypt } from 'aws-kms-thingy';

import crypto from 'crypto';

import glob from 'fast-glob';

import fs from 'fs';

import { Diff } from 'diff';

const AES_ALGORITHM = 'aes-256-ctr';

const decryptFile = async (file, returnContent = false) => {
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

const encryptFile = async (file) => {
  const { AWS_KEY_ID } = process.env;

  if (!AWS_KEY_ID) {
    console.error(`$AWS_KEY_ID IS REQUIRED !`.red);
    return file;
  }

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
    keyId: AWS_KEY_ID,
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

const encryptAll = async (root) => {
  const files = await glob([`${root}/packages/**/src/config/**.config.ts`], {
    onlyFiles: true,
  });

  const encrypted = (await Promise.all(files.map(encryptFile))).filter((e) => !!e);

  encrypted.map((e) => console.log(`=> ${e}`));
  console.log(`\nEncrypted ${`${encrypted.length}`.green} / ${`${files.length}`.green} files.`);
};

const decryptAll = async (root) => {
  const files = await glob([`${root}/packages/**/src/config/**.config.ts.encrypted`], {
    onlyFiles: true,
  });

  const decrypted = (await Promise.all(files.map((f) => decryptFile(f)))).filter((e) => !!e);

  decrypted.map((e) => console.log(`=> ${e}`));
  console.log(`\nDecrypted ${`${decrypted.length}`.green} / ${`${files.length}`.green} files.`);
};

const printDiff = (contentA, contentB) => {
  const diff = Diff.diffChars(contentA, contentB);

  diff.forEach((part) => {
    // eslint-disable-next-line no-nested-ternary
    const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
    process.stderr.write(part.value[color]);
  });
  console.log();
};

const diffFile = async (file, writeOutput = false) => {
  let decryptedContent = null;
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
        console.log('\nNo change detected.'.red);
        return null;
      } else {
        printDiff(existingContent, decryptedContent);
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

const diffList = async (root) => {
  const encryptedFiles = await glob([`${root}/packages/**/src/config/**.config.ts.encrypted`], {
    onlyFiles: true,
  });
  const files = await glob([`${root}/packages/**/src/config/**.config.ts`], {
    onlyFiles: true,
  });
  const toEncryptFiles = files.filter((f) => !encryptedFiles.includes(`${f}.encrypted`));

  const diff = (await Promise.all(encryptedFiles.map((f) => diffFile(f)))).filter((e) => !!e);

  diff.map((e) => console.log(`${'Updated'.cyan} => ${e}`));
  toEncryptFiles.map((e) => console.log(`${'New'.green} => ${e}`));

  console.log(
    `\nFound differences on ${diff.length} / ${encryptedFiles.length} files and ${toEncryptFiles.length} new file to encrypt`,
  );
};

const actions = {
  help: () => ({}),
  decrypt: decryptAll,
  encrypt: encryptAll,
  'diff-list': diffList,
  'diff-file': async (file) => {
    await diffFile(file, true);
  },
};

const main = async () => {
  const action = process.argv[2];

  if (!action || action === 'help' || !Object.keys(actions).includes(action)) {
    console.log(
      `
      ${'USAGE'.bold} : yarn anubis ${Object.keys(actions).join('|')} [file]
    `,
    );
    return;
  }

  await actions[action](process.argv[3]);
};

main();
