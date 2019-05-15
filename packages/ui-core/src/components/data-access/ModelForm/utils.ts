import { FieldOptions, ErrorsState, ChangeFn } from './interfaces';
import { get, AnyObject } from '@terascope/utils';

export function getFieldPropsFn<T extends AnyObject>(arg: {
    model: T;
    errors: ErrorsState<T>;
    required: (keyof T)[];
    setModel: (model: T) => void;
    validate: () => boolean;
}): (options: FieldOptions<T>) => any {
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
