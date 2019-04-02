'use strict';

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const peg = require('pegjs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function writeV1() {
    const input = path.join(__dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(__dirname, '..', 'peg', 'peg_engine.js');
    if (fs.existsSync(output)) fs.unlinkSync(output);

    const grammer = await readFile(input, 'utf8');
    const updated = peg.generate(grammer, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: false
    });

    await writeFile(output, updated, 'utf8');
}

async function writeV2() {
    const input = path.join(__dirname, '..', 'peg', 'lucene-v2.pegjs');
    const output = path.join(__dirname, '..', 'peg', 'peg_engine-v2.js');
    if (fs.existsSync(output)) fs.unlinkSync(output);

    const grammer = await readFile(input, 'utf8');
    const updated = peg.generate(grammer, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: false
    });

    await writeFile(output, updated, 'utf8');
}
module.exports = async () => Promise.all([writeV1(), writeV2()]);
