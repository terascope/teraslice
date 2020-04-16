import fieldTransforms from './FieldTransform';
import fieldValidators from './FieldValidator';

import { PluginClassType } from '../../../interfaces';

export default class DataMatePlugins implements PluginClassType {
    init() {
        return {
            ...fieldTransforms,
            ...fieldValidators
        };
    }
}
