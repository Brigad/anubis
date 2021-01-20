/* eslint-disable no-console */
import commandArgs from 'command-line-args';
import 'colors';

const usage = `
  ${'anubis'.green}

  ${'encrypt'.green} : encrypt all new/updated configuration files
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files pattern (eg: ./packages/**/**.config.ts)
      ${'--aws-kms-key-id'.grey} | ${'-k'.grey} | ${'$ANUBIS_AWS_KMS_KEY_ID'.grey} - AWS KMS key ID (arn:aws:kms:...)

  ${'decrypt'.green} : decrypt all encrypted config files
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files pattern (eg: ./packages/**/**.config.ts)

  ${'diff-list'.green} : lists all configuration files that differ from the encrypted file
      ${'--config-pattern'.grey} | ${'-p'.grey} | ${
  '$ANUBIS_CONFIG_PATTERN'.grey
} - configuration files pattern (eg: ./packages/**/**.config.ts)

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
  { name: 'config-pattern', alias: 'c', type: String },
  { name: 'config-file', alias: 'f', type: String },
  { name: 'aws-kms-key-id', alias: 'k', type: String },
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
    missingOption('config-pattern')
  }

  args.push(config);

  if (options.action === 'encrypt') {
    const key = options['aws-kms-key-id'] || process.env.ANUBIS_AWS_KMS_KEY_ID;
    
    if (!key) {
      missingOption('aws-kms-key-id')
    }
    args.push(key);
  }
} else {
  const file = options['config-file'];
    
  if (!file) {
    missingOption('config-file')
  }
  args.push(file);
}

export { args };
