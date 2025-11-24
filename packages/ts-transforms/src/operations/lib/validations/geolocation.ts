import { parseNumberList } from '@terascope/core-utils';
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class Geolocation extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
        // need to change source location to target parent field
        this.source = parentFieldPath(this.source);
        this.target = parentFieldPath(this.target);
        this.destination = this.target || this.source;
    }

    validate(geoData: any) {
        let isValid = false;

        if (typeof geoData === 'string') {
            const pieces = parseNumberList(geoData);
            if (pieces.length !== 2) return isValid;
            if ((pieces[0] <= 90 || pieces[0] >= -90)
                && (pieces[1] <= 180 || pieces[1] >= -180)) {
                isValid = true;
            }
        }

        if (typeof geoData === 'object') {
            const lat = geoData.lat || geoData.latitude;
            const lon = geoData.lon || geoData.longitude;
            if (lat && lon
                && (lat <= 90 && lat >= -90)
                && (lon <= 180 && lon >= -180)) {
                isValid = true;
            }
        }

        return isValid;
    }
}

function formatPath(str: string) {
    const parsedPath = str.split('.');
    const lastPath = parsedPath[parsedPath.length - 1];

    if (isGeoPathName(lastPath)) {
        parsedPath.pop();
        return parsedPath.join('.');
    }

    return str;
}

function parentFieldPath(field: string | string[]): string | string[] {
    if (Array.isArray(field)) {
        return field.map(formatPath)[0];
    }
    return formatPath(field);
}

function isGeoPathName(val: string) {
    return ['lat', 'lon', 'latitude', 'longitude'].includes(val);
}
