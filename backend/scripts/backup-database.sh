#!/bin/sh
set -eu

mkdir -p "$BACKUP_DIRECTORY"

while true; do
  filename="pautaviva-$(date -u +%Y%m%dT%H%M%SZ).dump"
  temporary_file="$BACKUP_DIRECTORY/$filename.tmp"

  pg_dump --format=custom --file="$temporary_file"
  mv "$temporary_file" "$BACKUP_DIRECTORY/$filename"
  find "$BACKUP_DIRECTORY" -type f -name 'pautaviva-*.dump' -mtime +"$BACKUP_RETENTION_DAYS" -delete
  echo "Database backup completed: $filename"

  sleep 86400
done
