import { ModelName } from '@terascope/data-access';
import { ModelConfigMapping } from './interfaces';
import userConfig from './User/config';
import roleConfig from './Role/config';
import dataTypeConfig from './DataType/config';
import viewConfig from './View/config';

const MODEL_CONFIG: ModelConfigMapping = {
    User: userConfig,
    Role: roleConfig,
    DataType: dataTypeConfig,
    View: viewConfig,
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
