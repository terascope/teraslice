#!/usr/bin/env node
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import peg from 'peggy';
import tspegjs from 'ts-pegjs';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

export default function generateEngine() {
    const input = path.join(dirPath, '..', 'peg', 'lucene.pegjs');
    const output = path.join(dirPath, '..', 'src', 'peg-engine.ts');

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
            customHeader: "import { makeContext } from './context.js';\nimport * as i from './interfaces.js';\nimport { xLuceneFieldType } from '@terascope/types';"
        },
    });

    if (current === updated) return null;
    fs.writeFileSync(output, updated, 'utf8');
    return output;
}

// we execute if used as a script
if (import.meta.url.startsWith('file:')) {
    const outputFile = generateEngine();

    if (outputFile) {
        console.error(`* generated ${path.relative(process.cwd(), outputFile)}`);
    }
}
