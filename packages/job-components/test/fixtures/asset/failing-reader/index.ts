import { legacyReaderShim } from '../../../../src';
import Fetcher from './fetcher';
import Slicer from './slicer';
import Schema from './schema';
// @ts-expect-error
import ExampleAPI from './api';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
export = legacyReaderShim(Slicer, Fetcher, Schema, {
    'example-reader': ExampleAPI
});
