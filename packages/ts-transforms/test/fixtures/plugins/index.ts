import NoOp from './noop.js';
import Double from './double.js';

export default class Plugin {
    init() {
        return {
            noop: NoOp,
            double: Double
        };
    }
}
