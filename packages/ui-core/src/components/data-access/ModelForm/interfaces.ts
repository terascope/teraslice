import PropTypes from 'prop-types';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';
import { AnyObject } from '@terascope/utils';
import FormInput from './FormInput';

export type ErrorsState = { fields: string[]; messages: string[] };
export const ErrorsStateProp = PropTypes.shape({
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    messages: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
});

export type FormChild = React.FC<{
    [prop: string]: any;
    model: AnyObject;
    setModel: (model: AnyObject) => void;
    FormInput: FormInput;
    update: boolean;
}>;

export type ValidateFn = (errs: ErrorsState, model: AnyObject, isSubmit: boolean) => ErrorsState;
export type BeforeSubmitFn = (model: AnyObject, create: boolean) => SubmitVars;

export type ComponentProps = {
    [prop: string]: any;
    input: AnyObject;
    id?: string;
    modelName: ModelName;
    validate: ValidateFn;
    beforeSubmit: BeforeSubmitFn;
    children: FormChild;
};

export const ComponentPropTypes = {
    id: PropTypes.string,
    input: PropTypes.any.isRequired,
    modelName: ModelNameProp.isRequired,
    validate: PropTypes.func.isRequired,
    beforeSubmit: PropTypes.func.isRequired,
};

export type SubmitVars = {
    [extra: string]: any;
    input: AnyObject;
};

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;
