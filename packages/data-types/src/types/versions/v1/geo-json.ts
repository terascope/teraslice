import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class GeoJSON extends BaseType {
    toESMapping(_version?: number) {
        // we need to used depcreated quadtree and strategy becuase CONTAINS is
        // not yet supported in 6.X or 7.X as of now
        return {
            mapping: {
                [this.field]: {
                    type: 'geo_shape' as ElasticSearchTypes,
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };
    }

    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL() {
        return this._formatGql('GeoJSON', 'scalar GeoJSON');
    }

    toXlucene() {
        return { [this.field]: FieldType.GeoJSON };
    }
}
