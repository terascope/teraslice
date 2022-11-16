#!/usr/bin/env node

async function main() {
    try {
        await import('../dist/src/command.js')
    } catch(err) {
        console.error('error while attempting to invoke cli command', err.toString());
        process.exit(1);
    }
}

main()
