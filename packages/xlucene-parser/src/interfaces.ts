import { AnyObject } from '@terascope/utils';
import { GeoDistanceUnit, XluceneTypeConfig, XluceneVariables } from '@terascope/types';

export interface GeoDistanceObj {
    distance: number;
    unit: GeoDistanceUnit;
}

export type JoinBy = 'AND'|'OR';

export interface JoinQueryResult {
    query: string;
    variables: XluceneVariables;
}

export type CreateJoinQueryOptions = {
    typeConfig?: XluceneTypeConfig;
    fieldParams?: Record<string, string>;
    joinBy?: JoinBy;
    variables?: AnyObject;
};
