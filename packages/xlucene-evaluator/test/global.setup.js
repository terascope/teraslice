'use strict';

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const peg = require('pegjs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = async () => {
    const input = path.join(__dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(__dirname, '..', 'peg', 'peg_engine.js');

    const grammer = await readFile(input, 'utf8');
    const updated = peg.generate(grammer, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: false
    });

    await writeFile(output, updated, 'utf8');
};
