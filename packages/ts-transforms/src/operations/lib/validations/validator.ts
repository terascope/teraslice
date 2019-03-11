
import _ from 'lodash';
import validator from 'validator';
import ValidationOpBase from './base';
import { OperationConfig, PluginClassType, InputOutputCardinality } from '../../../interfaces';

export class Validator extends ValidationOpBase<any> {
    private method: string;
    private value: any;

    constructor(config: OperationConfig, method: string) {
        super(config);
        this.method = method;
        this.value = config.value;
    }

    validate(value: any) {
        const args = this.value || this.config;
        if (!validator[this.method](value, args)) return false;
        return true;
    }
}

function setup(method: string) {
    return class ValidatorInterface {
        static cardinality: InputOutputCardinality = 'one-to-one';

        constructor(config: OperationConfig) {
            return new Validator(config, method);
        }
    };
}

export class ValidatorPlugins implements PluginClassType {
    // @ts-ignore FIXME: try to remove this ignore
    init() {
        return {
            contains: setup('contains'),
            equals: setup('equals'),
            after: setup('isAfter'),
            alpha: setup('isAlpha'),
            alphanumeric: setup('isAlphanumeric'),
            ascii: setup('isAscii'),
            base64: setup('isBase64'),
            before: setup('isBefore'),
            bytelength: setup('isByteLength'),
            creditcard: setup('isCreditCard'),
            currency: setup('isCurrency'),
            decimal: setup('isDecimal'),
            divisibleby: setup('isDivisibleBy'),
            empty: setup('isEmpty'),
            fqdn: setup('isFQDN'),
            float: setup('isFloat'),
            hash: setup('isHash'),
            hexcolor: setup('isHexColor'),
            hexadecimal: setup('isHexadecimal'),
            identitycard: setup('isIdentityCard'),
            iprange: setup('isIPRange'), // this only checks if its ipv4
            isbn: setup('isISBN'),
            issn: setup('isISSN'),
            isin: setup('isISIN'),
            iso8601: setup('isISO8601'),
            rfc3339: setup('isRFC3339'),
            iso31661alpha2: setup('isISO31661Alpha2'),
            iso31661alpha3: setup('isISO31661Alpha3'),
            isrc: setup('isISRC'),
            in: setup('isIn'),
            int: setup('isInt'),
            jwt: setup('isJWT'),
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
