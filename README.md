# Anubis [![Build](https://github.com/Brigad/anubis/actions/workflows/build.yml/badge.svg)](https://github.com/Brigad/anubis/actions/workflows/build.yml)

Encryption tools using AWS KSM

## Usage

```sh
  anubis

  encrypt : encrypt all new/updated configuration files
      --config-pattern | -p | $ANUBIS_CONFIG_PATTERN - configuration files pattern (eg: ./packages/**/**.config.ts)
      --aws-kms-key-id | -k | $ANUBIS_AWS_KMS_KEY_ID - AWS KMS key ID (eg: arn:aws:kms:...)
      --git_ignore_path | -g | $GIT_IGNORE_PATH - git ignore path where to add encrypted files (eg: ./.gitignore)
      --clean | -c - clean encrypted files

  decrypt : decrypt all encrypted config files
      --config-pattern | -p | $ANUBIS_CONFIG_PATTERN - configuration files pattern (eg: ./packages/**/**.config.ts)

  diff-list : lists all configuration files that differ from the encrypted file
      --config-pattern | -p | $ANUBIS_CONFIG_PATTERN - configuration files patterns separated by commas (eg: './packages/**/**.config.ts,./main.json')

  diff-file : displays the differences between the encrypted and the original file
      --config-file | -f - configuration file path (eg ./packages/app/production.config.ts[.encrypted])

  compare-encrypted-files : compare two encrypted files and shows the differences (keys removed, added, changed)
      --src | -s - source encrypted file
      --dest | -d - destination encrypted file
```


## License

This actions is distributed under the MIT license, check the [license file](LICENSE) for more info.
