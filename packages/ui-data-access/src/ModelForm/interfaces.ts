import PropTypes from 'prop-types';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';
import { Overwrite, AnyObject } from '@terascope/utils';

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

export type ValidateFn<T> = (errs: ErrorsState<T>, model: T, isSubmit: boolean) => void;
export type BeforeSubmitFn<T> = (model: T, create: boolean) => SubmitVars<T>;

export type ComponentProps<T> = {
    [extra: string]: any;
    input: T;
    id?: string;
    modelName: ModelName;
    validate?: ValidateFn<T>;
    afterChange?: (model: T) => void;
    beforeSubmit?: BeforeSubmitFn<T>;
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
    validate: PropTypes.func,
    afterChange: PropTypes.func,
    beforeSubmit: PropTypes.func,
};

export type SubmitVars<T> = {
    [extra: string]: any;
    input: T;
};

export type ChangeFn = (e: any, data: AnyObject) => void;

export type AnyModel = {
    id?: string;
    client_id: number;
    created: string;
    updated: string;
};

export type OverwriteModel<T> = Overwrite<
    T,
    {
        id?: string;
        client_id: number;
    }
> &
    AnyModel;

export type OverwriteModelWith<T, P> = Overwrite<
    T,
    {
        id?: string;
        client_id: number;
    } & P
> &
    AnyModel;
