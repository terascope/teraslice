import PropTypes from 'prop-types';
import { ModelName } from '@terascope/data-access';
import { RowMapping, ResolvedUser } from '@terascope/ui-components';
import { Overwrite } from '@terascope/utils';

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

export type ModelConfig<Input> = {
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
    searchFields: (keyof Input)[];
    requiredFields: (keyof Input)[];
    handleFormProps: (authUser: ResolvedUser, data: FormData<Input>) => FormResult<Input>;
    rowMapping: RowMapping<Overwrite<Input, { id: string }>>;
};
