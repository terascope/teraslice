
import { DataAccessConfig } from '@terascope/data-access';


export default class JoinStitcher {
    view: DataAccessConfig;

    constructor(view: DataAccessConfig) {
        this.view = view;
    }

    private isGeoJoinField(field: string): boolean {
        const dataTypeFields = this.view.data_type.config.fields;
        return dataTypeFields[field] != null && dataTypeFields[field].type === 'Geo';
    }

    private _geoQuery(target: string, value: any | any[], params: string | undefined) {
        if (value == null) return '';
        const distance = params || '100m';
        const { lat, lon }: { lat: string; lon: string } = value;
        return `${target}:(_geo_point_:"${lat},${lon}" _geo_distance_:${distance})`;
    }

    private _createQuery(target: string, value: string | string[]) {
        if (Array.isArray(value)) {
            return value.map((field) => `${target}:"${field}"`).join(' AND ');
        }

        return `${target}:"${value}"`;
    }

    make(target: string, value: any | any[], params: undefined | string) {
        if (this.isGeoJoinField(target)) {
            return this._geoQuery(target, value, params);
        }

        return this._createQuery(target, value);
    }
}
