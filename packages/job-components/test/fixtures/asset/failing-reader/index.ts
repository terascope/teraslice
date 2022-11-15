import { legacyReaderShim } from '../../../../src/index.js';
import Fetcher from './fetcher.js';
import Slicer from './slicer.js';
import Schema from './schema.js';
// @ts-expect-error
import ExampleAPI from './api.js';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
export default legacyReaderShim(Slicer, Fetcher, Schema, {
    'example-reader': ExampleAPI
});
