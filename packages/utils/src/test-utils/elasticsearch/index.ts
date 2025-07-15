import * as es from './elasticsearch.js';
import * as config from './config.js';

export const ElasticsearchTestHelpers = {
    ...es,
    ...config
};
