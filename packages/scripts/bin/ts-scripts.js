#!/usr/bin/env node

// import path from 'path';

// this path.join is only used for pkg asset injection
// path.join(__dirname, '../package.json');
// eslint-disable-next-line import/no-unresolved
async function main() {
    try {
        await import('../dist/src/command.js')
    } catch(err) {
        console.error(`Could not execute command file, error: ${err}`)
    }
}

main()
