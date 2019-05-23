import { ErrorsState, ChangeFn, GetFieldsPropsFn } from './interfaces';
import { get, AnyObject } from '@terascope/utils';

export function getFieldPropsFn(arg: {
    model: AnyObject;
    errors: ErrorsState;
    required: string[];
    setModel: (model: AnyObject) => void;
    validate: () => boolean;
}): GetFieldsPropsFn {
    const onChange: ChangeFn = (e, { name, value }) => {
        arg.setModel(
            Object.assign(arg.model, {
                [name]: value,
            })
        );
        arg.validate();
    };

    return ({ name, label, placeholder }) => {
        const hasError = arg.errors.fields.includes(name);

        return {
            name,
            label,
            placeholder: placeholder || label,
            value: get(arg.model, name, ''),
            onChange,
            error: hasError,
            required: arg.required.includes(name),
            width: 4,
        };
    };
}
