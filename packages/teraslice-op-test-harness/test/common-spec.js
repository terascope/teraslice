import * as module from './legacy-processors/foo.js';
import harnessPkg from '../index.js';

const harness = harnessPkg();
harness.runProcessorSpecs(module);
