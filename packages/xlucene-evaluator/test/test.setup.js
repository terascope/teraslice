'use strict';

require('jest-extended');
const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

const input = path.join(__dirname, '..', 'peg', 'lucene.grammar');
const output = path.join(__dirname, '..', 'peg', 'peg_engine.js');

const grammer = fs.readFileSync(input, 'utf8');
const updated = peg.generate(grammer, {
    output: 'source',
    optimize: 'speed',
    parser: {},
    format: 'commonjs',
    trace: false
});

fs.writeFileSync(output, updated, 'utf8');
