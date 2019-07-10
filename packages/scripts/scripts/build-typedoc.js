#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = 'development';
process.env.FORCE_COLOR = '1';

const path = require('path');
const fse = require('fs-extra');
const execa = require('execa');

try {
    require('typedoc');
} catch (_) {
    buildTypeDoc()
        .then(() => {
            require('typedoc');
            process.exit(0);
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err.message, err.all);
            process.exit(1);
        });
}

async function buildTypeDoc() {
    const typeDocPath = path.dirname(require.resolve('typedoc/package.json'));
    const pkgJSONPath = path.join(typeDocPath, 'package.json');
    const pkgJSON = await fse.readJSON(pkgJSONPath);
    for (const dep of Object.keys(pkgJSON.devDependencies)) {
        if (dep.includes('mocha') || dep.includes('mockery') || dep === 'nyc' || dep === 'tslint') {
            delete pkgJSON.devDependencies[dep];
        }
    }
    await fse.writeJSON(pkgJSONPath, pkgJSON);
    await fse.remove(path.join(typeDocPath, 'package-lock.json'));
    await fse.emptyDir(path.join(typeDocPath, 'src', 'test'));
    await execa('yarn', ['install'], {
        cwd: typeDocPath
    });
}
