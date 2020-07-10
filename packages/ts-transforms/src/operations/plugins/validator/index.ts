/* eslint-disable max-classes-per-file */
import { deprecate } from 'util';
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
    // @ts-expect-error
    init() {
        return {
            after: setup('isAfter'),
            alpha: deprecate(setup('isAlpha'), 'alpha is being deprecated, please use isAlpha instead', 'alpha'),
            base64: deprecate(setup('isBase64'), 'base64 is being deprecated, please use isBase64 instead', 'base64'),
            before: setup('isBefore'),
            bytelength: setup('isByteLength'),
            creditcard: setup('isCreditCard'),
            currency: setup('isCurrency'),
            decimal: setup('isDecimal'),
            email: deprecate(setup('isEmail'), 'email is being deprecated, please use isEmail instead', 'empty'),
            empty: deprecate(setup('isEmpty'), 'empty is being deprecated, please use isEmpty instead', 'empty'),
            float: setup('isFloat'),
            hash: deprecate(setup('isHash'), 'hash is being deprecated, please use isHash instead', 'hash'),
            hexcolor: setup('isHexColor'),
            hexadecimal: setup('isHexadecimal'),
            identitycard: setup('isIdentityCard'),
            iprange: deprecate(setup('isIPRange'), 'iprange is being deprecated, please use inIPRange instead', 'iprange'), // this only checks if its ipv4
            issn: deprecate(setup('isISSN'), 'issn is being deprecated, please use isISSN instead', 'issn'),
            isin: setup('isISIN'),
            iso8601: deprecate(setup('isISO8601'), 'iso8601 is being deprecated, please use isISO8601 instead', 'iso8601'),
            iso31661alpha2: setup('isISO31661Alpha2'),
            iso31661alpha3: setup('isISO31661Alpha3'),
            in: setup('isIn'),
            int: deprecate(setup('isInt'), 'int is being deprecated, please use isInteger instead', 'int'),
            latlong: deprecate(setup('isLatLong'), 'latlong is being deprecated, please use isGeoPoint instead', 'latlong'), // - This is different that our internal geolocation validation.
            length: deprecate(setup('isLength'), 'length is being deprecated, please use isLength instead', 'length'),
            matches: setup('matches'),
            md5: deprecate(setup('isMD5'), 'md5 is being deprecated, please use isHash instead', 'md5'),
            mimetype: deprecate(setup('isMimeType'), 'mimetype is being deprecated, please use isMIMEType instead', 'mimetype'),
            numeric: setup('isNumeric'),
            port: setup('isPort'),
            postalcode: deprecate(setup('isPostalCode'), 'postalcode is being deprecated, please use isPostalCode instead', 'postalcode'),
            rfc3339: deprecate(setup('isRFC3339'), 'rfc3339 is being deprecated, please use isRFC3339 instead', 'rfc3339')
        };
    }
}
