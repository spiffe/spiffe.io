#!/usr/bin/env bash

# Installs npm dependencies
npm install

# Pulls in external content
pipenv run python pull_external.py

# Runs Hugo server watching for file changes and rebuild
hugo server "$@" &

# Watches for changes in the external file descriptor
pipenv run watchmedo shell-command --wait --pattern="./external.yaml" --command="pipenv run python pull_external.py"
