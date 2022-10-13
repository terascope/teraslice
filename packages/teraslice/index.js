/**
 * Export of internal components and functions of teraslice.
 *
 * WARNING:
 *      Since these are internal components, breaking changes may occur if using them.
 *      For best results teraslice with an exact semver match, i.e "0.38.0".
*/

import config from './lib/config';
import stores from './lib/storage';
import makeTerafoundationContext from './lib/workers/context/terafoundation-context';
import { initializeTestExecution } from './lib/workers/helpers/job';

export default {
    initializeTestExecution,
    makeTerafoundationContext,
    config,
    stores,
};
