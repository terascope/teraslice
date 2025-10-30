import procProcessor from './proc/processor.js';
import procSchema from './proc/schema.js';
import procSlicer from './proc/slicer.js';
import proc2API from './proc2/api.js';
import proc2Schema from './proc2/schema.js';
import proc2Fetcher from './proc2/fetcher.js';

export default {
    proc: {
        Processor: procProcessor,
        Schema: procSchema,
        Slicer: procSlicer
    },
    proc2: {
        API: proc2API,
        Schema: proc2Schema,
        Fetcher: proc2Fetcher
    }
};
