#!/usr/bin/env bash

# Installs npm dependencies
npm install

# Pulls in external content
python3 pull_external.py

# Runs Hugo server watching for file changes and rebuild
hugo server "$@" &
hugo_pid=$!

# Watches for changes in the external file descriptor
watchmedo shell-command --wait --pattern="./external.yaml" --command="python3 pull_external.py" &
watch_pid=$!

# Stop both background jobs on Ctrl-C (SIGINT) or `docker stop` (SIGTERM).
# Both jobs must run in the background with `wait` below: if a job ran in the
# foreground, bash would block waiting on it and defer the signal, so the
# container would not exit (this is why --init alone wasn't enough).
trap 'kill "$hugo_pid" "$watch_pid" 2>/dev/null' INT TERM

# Wait for the background jobs; the trap above handles teardown on signal.
wait
