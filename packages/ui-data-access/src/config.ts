import { ModelName } from '@terascope/data-access';
import User from './User/config';
import Role from './Role/config';
import DataType from './DataType/config';
import View from './View/config';
import Space from './Space/config';

const MODEL_CONFIG = {
    User,
    Role,
    DataType,
    Space,
    View,
};

export function getModelConfig(modelName: ModelName) {
    return MODEL_CONFIG[modelName];
}
