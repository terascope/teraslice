/* eslint-disable max-classes-per-file */

import validator from 'validator';
import ValidationOpBase from '../../lib/validations/base';
import { PostProcessConfig, PluginClassType, InputOutputCardinality } from '../../../interfaces';

export class Validator extends ValidationOpBase<any> {
    private method: string;
    private value: any;

    constructor(config: PostProcessConfig, method: string) {
        super(config);
        this.method = method;
        this.value = config.value;
    }

    validate(value: any) {
        const args = this.value || this.config;
        return validator[this.method](value, args);
    }
}

function setup(method: string) {
    return class ValidatorInterface {
        static cardinality: InputOutputCardinality = 'one-to-one';

        constructor(config: PostProcessConfig) {
            return new Validator(config, method);
        }
    };
}

export class ValidatorPlugins implements PluginClassType {
    // @ts-ignore
    init() {
        return {
            contains: setup('contains'),
            equals: setup('equals'),
            after: setup('isAfter'),
            base64: setup('isBase64'),
            before: setup('isBefore'),
            bytelength: setup('isByteLength'),
            creditcard: setup('isCreditCard'),
            currency: setup('isCurrency'),
            decimal: setup('isDecimal'),
            empty: setup('isEmpty'),
            float: setup('isFloat'),
            hash: setup('isHash'),
            hexcolor: setup('isHexColor'),
            hexadecimal: setup('isHexadecimal'),
            identitycard: setup('isIdentityCard'),
            iprange: setup('isIPRange'), // this only checks if its ipv4
            issn: setup('isISSN'),
            isin: setup('isISIN'),
            iso8601: setup('isISO8601'),
            rfc3339: setup('isRFC3339'),
            iso31661alpha2: setup('isISO31661Alpha2'),
            iso31661alpha3: setup('isISO31661Alpha3'),
            in: setup('isIn'),
            int: setup('isInt'),
            latlong: setup('isLatLong'), // - This is different that our internal geolocation validation.
            length: setup('isLength'),
            md5: setup('isMD5'),
            mimetype: setup('isMimeType'),
            numeric: setup('isNumeric'),
            port: setup('isPort'),
            postalcode: setup('isPostalCode'),
            matches: setup('matches')
        };
    }
}
