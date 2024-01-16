#!/usr/bin/env node

'use strict';

// We are unsure what this does and it can probably be deleted, looks like something left
// from the migration from Node 10 to Node 12

const fs = require('fs');

const tmpPkgJSONPath = '/tmp/package.json';
const pkgJSONPath = '/app/source/package.json';

const arg = process.argv[2];

const pkgJSON = JSON.parse(fs.readFileSync(pkgJSONPath));
if (arg === 'pre') {
    fs.renameSync(pkgJSONPath, tmpPkgJSONPath);
    delete pkgJSON.workspaces;
    fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSON, null, 4));
} else if (arg === 'post') {
    fs.unlinkSync(pkgJSONPath);
    fs.renameSync(tmpPkgJSONPath, pkgJSONPath);
} else {
    console.error('Expected first arg to be either "pre" or "post"');
    process.exit(1);
}
