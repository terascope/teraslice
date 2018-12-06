import { legacyReaderShim } from '@terascope/job-components';
import Fetcher from './fetcher';
import Slicer from './slicer';
import Schema from './schema';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
export default legacyReaderShim(Slicer, Fetcher, Schema);
