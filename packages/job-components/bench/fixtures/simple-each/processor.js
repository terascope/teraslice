import { EachProcessor } from '../../../dist/src/index.js';

export default class SimpleEach extends EachProcessor {
    constructor(...args) {
        super(...args);
        this.counter = 0;
    }

    forEach(data) {
        if (!data) return;
        this.counter++;
    }
}
