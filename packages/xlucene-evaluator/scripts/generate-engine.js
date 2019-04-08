#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

function generate(suffix) {
    const input = path.join(__dirname, '..', 'peg', `lucene${suffix || ''}.pegjs`);
    const output = path.join(__dirname, '..', 'peg', `peg_engine${suffix || ''}.js`);

    const current = fs.existsSync(output) && fs.readFileSync(output, 'utf8');
    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: process.env.DEBUG_LUCENE === '1'
    });

    if (current === updated) return null;
    fs.writeFileSync(output, updated, 'utf8');
    return output;
}

if (require.main === module) {
    const outputFile = generate(process.argv[2]);
    if (outputFile) {
        // eslint-disable-next-line no-console
        console.error(`* generated ${path.relative(process.cwd(), outputFile)}`);
    }
} else {
    module.exports = generate;
}
