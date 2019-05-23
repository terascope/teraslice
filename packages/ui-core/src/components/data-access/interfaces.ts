import PropTypes from 'prop-types';
import { ModelName } from '@terascope/data-access';
import { RowMapping } from '@terascope/ui-components';

export const modelNames: ModelName[] = ['User', 'Role', 'DataType', 'View', 'Space'];
export const ModelNameProp = PropTypes.oneOf(modelNames);

export type ModelConfig = {
    pathname: string;
    singularLabel: string;
    pluralLabel: string;
    listQuery: any;
    removeMutation: any;
    searchFields: string[];
    rowMapping: RowMapping;
};

export type ModelConfigMapping = { readonly [name in ModelName]: ModelConfig };
