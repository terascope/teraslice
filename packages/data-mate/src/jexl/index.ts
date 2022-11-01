import jexlCore from 'jexl';
import { AnyObject, isNil } from '@terascope/utils';
import { Repository } from '../interfaces.js';

class Jexl extends jexlCore.Jexl {
    _context = {};

    evalSync(expression: string, _context: AnyObject | undefined) {
        let context;

        if (isNil(_context)) {
            context = this._context;
        } else {
            context = _context;
        }

        this._context = context;

        const exprObj = this.createExpression(expression);

        const results = exprObj.evalSync(context);
        this._context = {};

        return results;
    }
}

const jexl = new Jexl();

export const bridgeToJexl = (fn: any) => {
    return (value: any, _context: AnyObject | undefined, _config: any) => {
        const context = jexl._context;
        const config = _context;

        return fn(value, context, config as any);
    };
}

export function setup(operationClass: any) {
    for (const config of Object.values(operationClass.repository as Repository)) {
        jexl.addTransform(config.fn.name, bridgeToJexl(config.fn));
    }
}

export { jexl };
