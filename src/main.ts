#!/usr/bin/env node

import { args } from './args';
import { decryptAll } from './decrypt';
import { compareEncryptedFiles, diffFile, diffList } from './diff';
import { encryptAll } from './encrypt';

const actions = {
  decrypt: decryptAll,
  encrypt: encryptAll,
  'diff-list': diffList,
  'diff-file': diffFile,
  'compare-encrypted-files': compareEncryptedFiles,
};

const main = async () => {
  const [action, ...params] = args;

  await actions[action](...params);
};

main();
