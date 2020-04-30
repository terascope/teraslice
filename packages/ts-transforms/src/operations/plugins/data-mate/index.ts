import fieldTransforms from './FieldTransform';
import fieldValidators from './FieldValidator';
import recordValidators from './RecordValidator';
import recordTransforms from './RecordTransform';

import { PluginClassType } from '../../../interfaces';

export default class DataMatePlugins implements PluginClassType {
    init() {
        return {
            ...fieldTransforms,
            ...fieldValidators,
            ...recordValidators,
            ...recordTransforms,
        };
    }
}
