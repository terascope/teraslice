import PropTypes from 'prop-types';
import { ModelName } from '@terascope/data-access';
import { RowMapping, ResolvedUser } from '@terascope/ui-components';
import { AnyObject } from '@terascope/utils';

export const modelNames: ModelName[] = ['User', 'Role', 'DataType', 'View', 'Space'];
export const ModelNameProp = PropTypes.oneOf(modelNames);

export type ModelConfig = {
    pathname: string;
    singularLabel: string;
    pluralLabel: string;
    listQuery: any;
    updateQuery: any;
    createQuery?: any;
    createMutation: any;
    updateMutation: any;
    removeMutation: any;
    searchFields: string[];
    handleFormProps: (
        authUser: ResolvedUser,
        data: any
    ) => {
        [extra: string]: any;
        input: AnyObject;
    };
    rowMapping: RowMapping;
};

export type ModelConfigMapping = { readonly [name in ModelName]: ModelConfig };
