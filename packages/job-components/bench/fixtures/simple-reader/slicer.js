import { Slicer } from '../../../dist/src/index.js';

export default class SimpleSlicer extends Slicer {
    async slice() {
        return { hello: true };
    }
}
