/* eslint-disable no-console */
import commandArgs from 'command-line-args';
import 'colors';
import glob from 'fast-glob';

const usage = `
  ${'anubis'.green}

  ${'encrypt'.green} : encrypt all new/updated configuration files
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files pattern (eg: ./packages/**/**.config.ts)
      ${'--aws-kms-key-id'.grey} | ${'-k'.grey} | ${'$ANUBIS_AWS_KMS_KEY_ID'.grey} - AWS KMS key ID (eg: arn:aws:kms:...)
      ${'--git_ignore_path'.grey} | ${'-g'.grey} | ${'$GIT_IGNORE_PATH'.grey} - git ignore path where to add encrypted files (eg: ./.gitignore)
      ${'--clean'.grey} | ${'-c'.grey} - clean encrypted files

  ${'decrypt'.green} : decrypt all encrypted config files
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files pattern (eg: ./packages/**/**.config.ts)

  ${'diff-list'.green} : lists all configuration files that differ from the encrypted file
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files patterns separated by commas (eg: './packages/**/**.config.ts,./main.json')

  ${'diff-file'.green} : displays the differences between the encrypted and the original file
      ${'--config-file'.grey} | ${
  '-f'.grey
} - configuration file path (eg ./packages/app/production.config.ts[.encrypted])

  ${'help'.green} : print this usage
`;

export const missingOption = (optionName: string) => {
  console.error(`
  >>> ERROR: Missing option ${optionName}
`);
  console.log(usage);

  process.exit(1);
};

export const errorOption = (error: string) => {
  console.error(`
  >>> ERROR: ${error}
`);
  console.log(usage);

  process.exit(1);
};

const argsDef: commandArgs.OptionDefinition[] = [
  { name: 'config-pattern', alias: 'p', type: String },
  { name: 'config-file', alias: 'f', type: String },
  { name: 'aws-kms-key-id', alias: 'k', type: String },
  { name: 'git_ignore_path', alias: 'g', type: String },
  { name: 'clean', alias: 'c', type: Boolean, defaultValue: false },
  { name: 'action', alias: 'a', type: String, defaultOption: true },
];

let foundOptions: commandArgs.CommandLineOptions;

try {
  foundOptions = commandArgs(argsDef);
} catch (err) {
  errorOption(err.message);
  process.exit(1);
}

const options = foundOptions;

if (!options.action || options.action === 'help') {
  console.log(usage);

  process.exit(0);
}

if (!['encrypt', 'decrypt', 'help', 'diff-file', 'diff-list'].includes(options.action)) {
  errorOption('invalid command');
}

const args = [options.action];

if (options.action !== 'diff-file') {
  const config = options['config-pattern'] || process.env.ANUBIS_CONFIG_PATTERN;
    
  if (!config) {
    missingOption('config-pattern');
  }

  args.push(config);

  if (options.action === 'encrypt') {
    const key = options['aws-kms-key-id'] || process.env.ANUBIS_AWS_KMS_KEY_ID;
    
    if (!key) {
      missingOption('aws-kms-key-id');
    }
    args.push(key);

    const clean = options['clean'];
    
    args.push(clean);

    const git_ignore_path = options['git_ignore_path'] || process.env.GIT_IGNORE_PATH;
    
    if (git_ignore_path) {
      args.push(git_ignore_path);
    }
  }
} else {
  const file = options['config-file'];
    
  if (!file) {
    missingOption('config-file');
  }
  args.push(file);
}

const getFiles = async (patterns: string) => {
  const encryptedFiles = await glob(patterns.split(',').map(p => p.endsWith('.encrypted') ? p : p + '.encrypted'), {
    onlyFiles: true,
  });
  const orignialFiles = await glob(patterns.split(',').map(p =>
    p.endsWith('.encrypted') ? p.replace(/\.encrypted$/, '') : p)
  , {
    onlyFiles: true,
  });

  const newFiles = orignialFiles.filter(f => !encryptedFiles.includes(`${f}.encrypted`));
  const alreadyEncryptedFilesWithOriginales = orignialFiles.filter(f => encryptedFiles.includes(`${f}.encrypted`));

  return { encryptedFiles, orignialFiles, newFiles, alreadyEncryptedFilesWithOriginales };
} 

export { args, getFiles };
