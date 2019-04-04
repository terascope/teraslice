'use strict';

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

function createV1() {
    const input = path.join(__dirname, '..', 'peg', 'lucene.pegjs');
    const output = path.join(__dirname, '..', 'peg', 'peg_engine.js');

    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: false
    });

    if (output === updated) return;
    fs.writeFileSync(output, updated, 'utf8');
}

function createV2() {
    const input = path.join(__dirname, '..', 'peg', 'lucene-v2.pegjs');
    const output = path.join(__dirname, '..', 'peg', 'peg_engine-v2.js');
    if (fs.existsSync(output)) fs.unlinkSync(output);

    const grammar = fs.readFileSync(input, 'utf8');
    const updated = peg.generate(grammar, {
        output: 'source',
        optimize: 'speed',
        parser: {},
        format: 'commonjs',
        trace: true
    });

    if (output === updated) return;
    fs.writeFileSync(output, updated, 'utf8');
}
module.exports = () => {
    createV1();
    createV2();
};
