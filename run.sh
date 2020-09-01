#!/usr/bin/env bash

# Installs npm dependencies
npm install

# Pulls in external content
pipenv run python pull_external.py

# Runs Hugo server watching for file changes and rebuild
hugo server --buildDrafts --buildFuture &

# Watches for changes in the external file descriptor
inotifywait -r -m -e modify external.yaml |
    while read path _ file; do 
        echo "----- Pulling in external content. Please wait. -----"
        pipenv run python pull_external.py
    done
