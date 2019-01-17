'use strict';

const fs = require('fs');
const readline = require('readline');

const filePath = process.argv[2];
const { DocumentMatcher } = require('../dist/index')

if (!filePath) throw new Error('a file path must be provided ie "node scripts/parse_file.js path/to/file.txt"');

const rl = readline.createInterface({
    input: fs.createReadStream(filePath)
  });

rl.on('line', (input) => {
    try {
        const matcher = new DocumentMatcher(input); 
    } catch(err) {
        console.log(`error while parsing input ${input}
        
        
    `, err)
    }
  });

console.log('done parsing all queries');
