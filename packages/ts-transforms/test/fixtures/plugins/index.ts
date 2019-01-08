
import NoOp from './noop';
import Double from './double';

export default class Plugin {
    init() {
        return {
            noop: NoOp,
            double: Double
        };
    }
}
