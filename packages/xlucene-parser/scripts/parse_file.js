'use strict';

const fs = require('fs');
const readline = require('readline');

const filePath = process.argv[2];
const { Parser } = require('../dist/src');

if (!filePath) throw new Error('A file path must be provided ie "node scripts/parse_file.js path/to/file.txt"');

const rl = readline.createInterface({
    input: fs.createReadStream(filePath)
});

rl.on('line', (input) => {
    try {
        // eslint-disable-next-line
        let matcher;
        if (input.length > 0 && input.trim()[0] !== '#') matcher = new Parser(input);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`error while parsing input ${input}`, err);
    }
});

// eslint-disable-next-line no-console
console.log('done parsing all queries');
