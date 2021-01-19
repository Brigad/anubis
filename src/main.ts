#!/usr/bin/env node

import { args } from './args';
import { decryptAll } from './decrypt';
import { diffFile, diffList } from './diff';
import { encryptAll } from './encrypt';

const actions = {
  decrypt: decryptAll,
  encrypt: encryptAll,
  'diff-list': diffList,
  'diff-file': diffFile,
};

const main = async () => {
  const [action, ...params] = args;

  await actions[action](...params);
};

main();
