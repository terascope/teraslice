
import _ from 'lodash';
import ValidationOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Geolocation extends ValidationOpBase<any> {
    constructor(config: OperationConfig) {
        super(config);
        // need to change source location to target parent field
        this.source = this.parentFieldPath(this.source);
        // TODO: fix this overwriting, this checks if its a compact config
        if (config.target_field && config.source_field) {
            this.hasTarget = false;
            this.destination = this.source;
        }
    }

    validate(geoData: any) {
        let isValid = false;

        if (typeof geoData === 'string') {
            const pieces = geoData.split(',').map(str => Number(str));
            if (pieces.length !== 2) return isValid;
            if ((pieces[0] <= 90 || pieces[0] >= -90) && (pieces[1] <= 180 || pieces[1] >= -180)) isValid = true;
        }

        if (typeof geoData === 'object') {
            const lat = geoData.lat | geoData.latitude;
            const lon = geoData.lon | geoData.longitude;
            if (lat && lon && (lat <= 90 && lat >= -90) && (lon <= 180 && lon >= -180)) isValid = true;
        }
        return isValid;
    }
}
