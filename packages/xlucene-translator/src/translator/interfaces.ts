import { Logger } from '@terascope/utils';
import {
    SortOrder, xLuceneTypeConfig, xLuceneVariables,
    GeoDistanceUnit, GeoPoint, ClientMetadata
} from '@terascope/types';

export type TranslatorOptions = {
    logger?: Logger;
    type_config?: xLuceneTypeConfig;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit|string;
    variables?: xLuceneVariables;
    filterNilVariables?: boolean;
};

/**
 * @internal
*/
export interface UtilsTranslateQueryOptions extends Partial<ClientMetadata> {
    logger: Logger;
    type_config: xLuceneTypeConfig;
    variables: xLuceneVariables;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
}
