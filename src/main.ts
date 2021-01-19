#!/usr/bin/env node

import { args } from './args';
import { decryptAll } from './decrypt';
import { diffFile, diffList } from './diff';

const actions = {
  decrypt: decryptAll,
  encrypt: decryptAll,
  'diff-list': diffList,
  'diff-file': diffFile,
};

const main = async () => {
  const [action, ...params] = args;

  await actions[action](...params);
};

main();
