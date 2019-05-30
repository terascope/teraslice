import PropTypes from 'prop-types';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';

export type ErrorsState<T> = { fields: (keyof T)[]; messages: string[] };
export const ErrorsStateProp = PropTypes.shape({
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    messages: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
});

export type FormChild<T> = React.FC<{
    [extra: string]: any;
    model: T;
    updateModel: (model: Partial<T>) => void;
    defaultInputProps: DefaultInputProps<T>;
    update: boolean;
}>;

export type ValidateFn<T> = (errs: ErrorsState<T>, model: T, isSubmit: boolean) => ErrorsState<T>;
export type BeforeSubmitFn<T> = (model: T, create: boolean) => SubmitVars<T>;

export type ComponentProps<T> = {
    [extra: string]: any;
    input: T;
    id?: string;
    modelName: ModelName;
    validate: ValidateFn<T>;
    beforeSubmit: BeforeSubmitFn<T>;
    children: FormChild<T>;
};

export type DefaultInputProps<T> = {
    hasError: (field: keyof T) => boolean;
    isRequired: (field: keyof T) => boolean;
    onChange: ChangeFn;
};

export const ComponentPropTypes = {
    id: PropTypes.string,
    input: PropTypes.any.isRequired,
    modelName: ModelNameProp.isRequired,
    validate: PropTypes.func.isRequired,
    beforeSubmit: PropTypes.func.isRequired,
};

export type SubmitVars<T> = {
    [extra: string]: any;
    input: T;
};

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

export type AnyModel = {
    id?: string;
    client_id: string | number;
    created: string;
    updated: string;
};
