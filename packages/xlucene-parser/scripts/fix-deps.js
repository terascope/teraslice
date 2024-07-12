import fs from 'node:fs';
import { createRequire } from 'node:module';

/*

Due to this error list here
https://github.com/metadevpro/ts-pegjs/issues/114

list is ran as a postinstall to fix this issue when importing ts-pegjs in a esm module environment
*/

const faultyString1 = 'import * as prettierPluginTypescript from "prettier/parser-typescript";';
const correctString1 = 'import prettierPluginTypescript from "prettier/esm/parser-typescript.mjs";';

const faultyString2 = 'import prettier from "prettier/standalone";';
const correctString2 = 'import prettier from "prettier/esm/standalone.mjs";';

const require = createRequire(import.meta.url);

const modulePath = require.resolve('ts-pegjs');
const filePath = modulePath.replace('tspegjs.js', 'tspegjs.mjs');

let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(faultyString1, correctString1);
code = code.replace(faultyString2, correctString2);

fs.writeFileSync(filePath, code);
