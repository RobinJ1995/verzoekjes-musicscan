#! /bin/bash
set -ex

npm install --include=dev
pkg -t node14-linux-x64,node14-macos-x64,node14-win-x64 -o musicscan main.js
