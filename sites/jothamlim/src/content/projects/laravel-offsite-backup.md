---
title: laravel-offsite-backup
description: A Deployer recipe and hardened preset for spatie/laravel-backup, with pre-flight checks and restore drills run off the server.
date: 2026-10-07
updated: 2026-10-08T09:28:46+00:00
---
spatie/laravel-backup takes the backups. This package is what I kept rebuilding around it on each app I deploy, after finding out, one app at a time, that "we have backups" was not true.

Every failure it guards against happened in production: a backup scheduled where nothing ran the scheduler; a scheduler running as `www-data` that could not read `.env`, so the backup stopped at the first unreadable directory; a PHP whose zip library had no AES; a size cap that quietly deleted the monthly backups the retention promised to keep; storage skipped because Deployer makes it a symlink; checksums Backblaze B2 rejects; a dump no restore could read because `pg_dump` was newer than the server.

- **`offsite:install`** writes a hardened `config/backup.php`, derived from spatie's own, with disk presets for B2, R2, S3 and Wasabi.
- **`offsite:doctor`** runs thirteen pre-flight checks for the failures that otherwise surface weeks later.
- **`offsite:verify`** is a restore drill run on my own machine, not the server: it downloads the newest backup, decrypts it and restores the dumps into throwaway databases.
- **The Deployer recipe** writes the settings into `.env` from 1Password with one approval per run, or from Doppler, files or the environment, and installs the scheduler without running it twice.

Every archive is encrypted with its app's own password and carries a manifest of what was backed up, what was skipped and why. It backs up this site and every app I deploy. MIT-licensed.

## Links

- [Repository](https://github.com/Jotham-LEC/laravel-offsite-backup)
- [Packagist](https://packagist.org/packages/jothamlec/laravel-offsite-backup)