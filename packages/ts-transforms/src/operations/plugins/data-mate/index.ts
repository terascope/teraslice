import fieldTransforms from './FieldTransform.js';
import fieldValidators from './FieldValidator.js';
import recordValidators from './RecordValidator.js';
import recordTransforms from './RecordTransform.js';

import { PluginClassType } from '../../../interfaces.js';

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
