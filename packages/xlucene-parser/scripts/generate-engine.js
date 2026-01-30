#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import peg from 'peggy';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const injectionList = [
    '// @ts-nocheck',
    'import { xLuceneFieldType } from "@terascope/types";',
    'import { makeContext } from "./context.js";',
    'import * as i from "./interfaces.js";',
];

function injectNoCheck(node) {
    node.code.children.unshift(injectionList.join('\n'));
}

const injectionPlugin = {
    use(config, _options) {
        config.passes.generate.push(injectNoCheck);
    }
};

export default function generate() {
    const input = path.join(dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(dirname, '..', 'src', 'peg-engine.ts');

    const current = fs.existsSync(output) && fs.readFileSync(output, 'utf8');
    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        plugins: [injectionPlugin],
        parser: {},
        format: 'es',
        dts: true,
    });

    if (current === updated) return null;
    fs.writeFileSync(output, updated, 'utf8');
    return output;
}

if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url);
    const executePath = process.argv[1];

    if (executePath === modulePath) {
        const outputFile = generate();
        if (outputFile) {
            console.error(`* generated ${path.relative(process.cwd(), outputFile)}`);
        }
    }
}
