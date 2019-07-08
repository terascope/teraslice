#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = 'development';
process.env.FORCE_COLOR = '1';

const path = require('path');
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
    await execa('yarn', ['install'], {
        cwd: typeDocPath
    });

    await execa('yarn', ['build'], {
        cwd: typeDocPath
    });
}
