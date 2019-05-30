import PropTypes from 'prop-types';
import { ModelName } from '@terascope/data-access';
import { RowMapping, ResolvedUser } from '@terascope/ui-components';
import { Overwrite } from '@terascope/utils';
import { AnyModel } from './ModelForm';

export const modelNames: ModelName[] = ['User', 'Role', 'DataType', 'View', 'Space'];
export const ModelNameProp = PropTypes.oneOf(modelNames);
export type FormData<T> = {
    [extra: string]: any;
    result: T;
};
export type FormResult<T> = {
    [extra: string]: any;
    input: T;
};

export type ModelConfig<T extends AnyModel> = {
    name: ModelName;
    pathname: string;
    singularLabel: string;
    pluralLabel: string;
    listQuery: any;
    updateQuery: any;
    createQuery?: any;
    createMutation: any;
    updateMutation: any;
    removeMutation: any;
    searchFields: (keyof T)[];
    requiredFields: (keyof T)[];
    handleFormProps: (authUser: ResolvedUser, data: FormData<T>) => FormResult<T>;
    rowMapping: RowMapping<Overwrite<T, { id: string }>>;
};
