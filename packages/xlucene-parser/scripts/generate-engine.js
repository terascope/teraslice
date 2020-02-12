#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');
const tspegjs = require('ts-pegjs');

function generate() {
    try {
        const cleanCords = require.resolve('@turf/clean-coords');
        fs.unlinkSync(cleanCords.replace('index.js', 'index.ts'));
        console.error('removed @turf/clean-coords/index.ts');
    } catch (err) {
        // ignore me
    }

    const input = path.join(__dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(__dirname, '..', 'src', 'peg-engine.ts');

    const current = fs.existsSync(output) && fs.readFileSync(output, 'utf8');
    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        plugins: [tspegjs],
        parser: {},
        format: 'commonjs',
        tspegjs: {
            noTslint: true,
            customHeader: "import makeContext from './context';\nimport * as i from './interfaces';\n import { XluceneFieldType } from '@terascope/types';"
        },
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
