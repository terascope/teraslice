
import { Request } from 'express';
import { Logger } from '@terascope/utils';
import { AuthUser } from '@terascope/data-access';
import { SortOrder, GeoDistanceUnit } from 'xlucene-evaluator';


export interface SpacesContext {
    user: AuthUser;
    req: Request;
    authenticating: boolean;
    logger: Logger;
}

export interface ParsedJoinFields {
    origin: string;
    target: string;
    extraParams?: string;
}

export interface EndpointArgs {
    join?: string[];
    query?: string;
    size?: number;
    from?: number;
    sort?: string;
    geoSortPoint?: string;
    geoSortOrder?: SortOrder;
    geoSortUnit?: GeoDistanceUnit | string;
}
