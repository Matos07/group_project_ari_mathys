#!/bin/sh
set -e

# ------------------------------------------------------------------------------
# Container entrypoint for Cloud Run and Docker.
# Hands control to CMD ("node", "dist/server.js") via exec so the application
# becomes PID 1 and receives SIGTERM from Cloud Run for graceful shutdown.
# Ref: https://cloud.google.com/run/docs/container-contract#instance-shutdown
# ------------------------------------------------------------------------------
exec "$@"
