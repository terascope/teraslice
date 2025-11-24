import { get, DataEntity } from '@terascope/core-utils';
import { FieldValidator } from '@terascope/data-mate';
import { InjectMethod } from '../mixins.js';
import OperationBase from '../../lib/base.js';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces.js';

const FieldValidatorContainer = {} as any;

class Validator extends OperationBase {
    invert: boolean;
    inputIsArray = false;
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
        this.invert = this.config.output === false;
    }

    // this is overwritten with mixin
    method(_value: any, _context: any, _args: any) {
        return false;
    }

    run(doc: DataEntity) {
        const value = this._getSourceValue(doc);

        try {
            if (Array.isArray(value) && !this.inputIsArray) {
                this._handleArrayValue(doc, value);
            } else {
                this._handleSingleValue(doc, value);
            }
        } catch (err) {
            this.removeSource(doc);
        }

        if (Object.keys(doc).length === 0) return null;
        return doc;
    }

    private _getSourceValue(doc: DataEntity) {
        if (Array.isArray(this.source)) {
            return this.source.map((field) => get(doc, field));
        }

        return get(doc, this.source);
    }

    private _handleArrayValue(doc: DataEntity, value: any[]) {
        const results = value.filter((item) => this._isValid(item));

        if (results.length === 0) {
            this.removeSource(doc);
            return;
        }

        this.set(doc, results);
    }

    private _handleSingleValue(doc: DataEntity, value: any) {
        if (this._isValid(value)) {
            this.set(doc, value);
            return;
        }

        this.removeSource(doc);
    }

    private _isValid(value: any): boolean {
        const validationCheck = this.method(value, value, this.config);

        if (this.invert && value != null) return !validationCheck;

        return validationCheck;
    }
}

function setup(method: keyof typeof FieldValidator) {
    return InjectMethod(Validator, FieldValidator[method], FieldValidator.repository[method]);
}

for (const config of Object.values(FieldValidator.repository)) {
    const fnName = config.fn.name;
    FieldValidatorContainer[fnName] = setup(fnName);
}

export default FieldValidatorContainer;
