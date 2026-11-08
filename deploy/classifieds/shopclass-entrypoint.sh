#!/bin/sh
set -eu
# While testing, use Render's actual public preview address.
# Once DNS is connected, configure WEB_PATH=https://murdilimax.com/ in Render.
if [ -z "${WEB_PATH:-}" ]; then
  if [ -z "${RENDER_EXTERNAL_HOSTNAME:-}" ]; then
    echo "RENDER_EXTERNAL_HOSTNAME or WEB_PATH is required" >&2
    exit 1
  fi
  export WEB_PATH="https://${RENDER_EXTERNAL_HOSTNAME}/"
fi
exec /application/.docker/prod/entrypoint.sh "$@"
