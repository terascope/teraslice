#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import peg from 'peggy';
import tspegjs from 'ts-pegjs';

export default function generate() {
    const input = path.join(__dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(__dirname, '..', 'src/index.js', 'peg-engine.ts');

    const current = fs.existsSync(output) && fs.readFileSync(output, 'utf8');
    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        plugins: [tspegjs],
        parser: {},
        format: 'es',
        tspegjs: {
            noTslint: true,
            customHeader: "import { makeContext } from './context';\nimport * as i from './interfaces.js';\nimport { xLuceneFieldType } from '@terascope/types';"
        },
    });

    if (current === updated) return null;
    fs.writeFileSync(output, updated, 'utf8');
    return output;
}

// if (require.main === module) {
//     const outputFile = generate();
//     if (outputFile) {
//         console.error(`* generated ${path.relative(process.cwd(), outputFile)}`);
//     }
// }
