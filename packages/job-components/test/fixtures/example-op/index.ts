import { legacyProcessorShim } from '../../../src';
import Processor from './processor';
import Schema from './schema';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
export = legacyProcessorShim(Processor, Schema);
