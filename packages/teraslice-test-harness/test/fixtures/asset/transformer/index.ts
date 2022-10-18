import { legacyProcessorShim } from '@terascope/job-components';
import Processor from './processor.js';
import Schema from './schema.js';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
export default legacyProcessorShim(Processor, Schema);
