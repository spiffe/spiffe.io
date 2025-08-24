#!/usr/bin/env bash

# Installs npm dependencies
npm install

# Pulls in external content
python3 pull_external.py

# Runs Hugo server watching for file changes and rebuild
hugo server "$@" &

# Watches for changes in the external file descriptor
watchmedo shell-command --wait --pattern="./external.yaml" --command="python3 pull_external.py"
