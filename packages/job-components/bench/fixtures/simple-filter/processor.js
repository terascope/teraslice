import { FilterProcessor } from '../../../dist/src/index.js';

export default class SimpleFilter extends FilterProcessor {
    filter(data) {
        return data.filterMe;
    }
}
