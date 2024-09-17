/* eslint-disable no-console */
import { config, data } from './fixtures/data.json';
import { Column } from '../dist/src/index.js';

const name = 'results';
const fieldConfig = config.fields[name];
const values = data.map((row) => row[name]);

const startRSS = process.memoryUsage().rss;
console.log(`Building ${values.length} rows`);

console.time(`Built ${values.length} rows`);

const column = Column.fromJSON(name, fieldConfig, values);
console.timeEnd(`Built ${values.length} rows`);

const endRSS = process.memoryUsage().rss;
// eslint-disable-next-line no-console
console.log('DONE', endRSS - startRSS);

setTimeout(() => console.error('exiting...'), 5000);

// this ensures it is kept in memory
export {
    column
};
