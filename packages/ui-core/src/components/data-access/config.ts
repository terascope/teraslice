import { ModelName } from '@terascope/data-access';
import { ModelConfigMapping } from './interfaces';
import usersConfig from './Users/config';
import rolesConfig from './Roles/config';
import dataTypesConfig from './DataTypes/config';

const MODEL_CONFIG: ModelConfigMapping = {
    User: usersConfig,
    Role: rolesConfig,
    DataType: dataTypesConfig,
    View: {
        name: 'View',
        pathname: 'views',
        singularLabel: 'View',
        pluralLabel: 'Views',
        searchFields: [],
        requiredFields: [],
        // @ts-ignore FIXME
        rowMapping: {},
        removeMutation: '',
        updateQuery: '',
        listQuery: '',
    },
    Space: {
        name: 'Space',
        pathname: 'spaces',
        singularLabel: 'Space',
        pluralLabel: 'Spaces',
        searchFields: [],
        requiredFields: [],
        // @ts-ignore FIXME
        rowMapping: {},
        removeMutation: '',
        updateQuery: '',
        listQuery: '',
    },
};

export function getModelConfig(modelName: ModelName) {
    return MODEL_CONFIG[modelName];
}
