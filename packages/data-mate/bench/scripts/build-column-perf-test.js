/* eslint-disable no-console */
import json from './fixtures/data.json' with { type: 'json' };
import { Column } from '../dist/src/index.js';

const { config, data } = json;

const name = 'results';
const fieldConfig = config.fields[name];
const values = data.map((row) => row[name]);

const startRSS = process.memoryUsage().rss;
console.log(`Building ${values.length} rows`);

console.time(`Built ${values.length} rows`);

const column = Column.fromJSON(name, fieldConfig, values);
console.timeEnd(`Built ${values.length} rows`);

const endRSS = process.memoryUsage().rss;

console.log('DONE', endRSS - startRSS);

setTimeout(() => console.error('exiting...'), 5000);

// this ensures it is kept in memory
export {
    column
};
