#!/bin/bash

set -e

if [ -z "$NPM_TOKEN" ] {
    echo "Missing NPM_TOKEN enviroment";
    exit 1;
}

echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

lerna publish --yes from-git