
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';

export default class Geolocation extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const geoFieldData = this.fieldPath(this.source);
        const geoData = _.get(doc, geoFieldData);
        let hasError = true;
        if (!geoData) return doc;

        if (typeof geoData === 'string') {
            hasError = false;
            const pieces = geoData.split(',').map(str => Number(str));
            if (pieces.length !== 2) hasError = true;
            if (pieces[0] > 90 || pieces[0] < -90) hasError = true;
            if (pieces[1] > 180 || pieces[1] < -180) hasError = true;
        }

        if (typeof geoData === 'object') {
            hasError = false;
            const lat = geoData.lat | geoData.latitude;
            const lon = geoData.lon | geoData.longitude;
            if (!lat || (lat > 90 || lat < -90)) hasError = true;
            if (!lon || (lon > 180 || lon < -180)) hasError = true;
        }

        if (hasError) _.unset(doc, geoFieldData);
        return doc;
    }
}
