
import _ from 'lodash';
import { parseNumberList } from '@terascope/utils';
import ValidationOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Geolocation extends ValidationOpBase<any> {
    constructor(config: OperationConfig) {
        super(config);
        // console.log("the config", config, this.target)
        // need to change source location to target parent field
        this.source = parentFieldPath(this.source);
        this.target = parentFieldPath(this.target);

        this.destination = this.target || this.source;
       // console.log('source', this.source, this.target)
        // TODO: fix this overwriting, this checks if its a compact config
        // if (config.target_field && config.source_field) {
        //     this.hasTarget = false;
        //     this.destination = this.source;
        // }
    }

    validate(geoData: any) {
        let isValid = false;

        if (typeof geoData === 'string') {
            const pieces = parseNumberList(geoData);
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

function formatPath(str: string) {
    return str.lastIndexOf('.') === -1 ? str : str.slice(0, str.lastIndexOf('.'));
}

function parentFieldPath(field: string|string[]): string|string[] {
    if (Array.isArray(field)) {
        return field.map(formatPath)[0];
    }
    return formatPath(field);
}
