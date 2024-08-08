/* eslint-disable max-classes-per-file */
import { deprecate } from 'util';
import validator from 'validator';
import ValidationOpBase from '../../lib/validations/base.js';
import { PostProcessConfig, PluginClassType, InputOutputCardinality } from '../../../interfaces.js';

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
            // eslint-disable-next-line no-constructor-return
            return new Validator(config, method);
        }
    };
}

export class ValidatorPlugins implements PluginClassType {
    // @ts-expect-error
    init() {
        return {
            after: deprecate(setup('isAfter'), 'after is being deprecated., please use isAfter instead', 'after'),
            alpha: deprecate(setup('isAlpha'), 'alpha is being deprecated, please use isAlpha instead', 'alpha'),
            alphanumeric: deprecate(setup('isAlphanumeric'), 'alphanumeric is being deprecated, please use is Alphanumeric instead', 'alphanumeric'),
            ascii: deprecate(setup('isAscii'), 'ascii is being deprecated, please use isAscii instead', 'ascii'),
            base64: deprecate(setup('isBase64'), 'base64 is being deprecated, please use isBase64 instead', 'base64'),
            before: deprecate(setup('isBefore'), 'before is being deprecated, please use isBefore instead', 'before'),
            bytelength: deprecate(setup('isByteLength'), 'bytelength is being deprecated, please use isByteLength instead', 'bytelength'),
            creditcard: deprecate(setup('isCreditCard'), 'creditcard is being deprecated, please use isCreditCard instead', 'creditcard'),
            currency: deprecate(setup('isCurrency'), 'currency is being deprecated, please use isCurrency instead', 'currency'),
            decimal: deprecate(setup('isDecimal'), 'decimal is being deprecated, please use isDecimal instead', 'decimal'),
            divisibleby: deprecate(setup('isDivisibleBy'), 'divisibleby is being deprecated, please use isDivisibleBy instead', 'divisibleby'),
            empty: deprecate(setup('isEmpty'), 'empty is being deprecated, please use isEmpty instead', 'empty'),
            float: deprecate(setup('isFloat'), 'float is being deprecated, please use isFloat instead', 'float'),
            fqdn: deprecate(setup('isFQDN'), 'fqdn is being deprecated, please use isFQDN instead', 'fqdn'),
            hash: deprecate(setup('isHash'), 'hash is being deprecated, please use isHash instead', 'hash'),
            hexcolor: deprecate(setup('isHexColor'), 'hexcolor is being deprecated, please use isHexColor instead', 'hexcolor'),
            hexadecimal: deprecate(setup('isHexadecimal'), 'hexadecimal is being deprecated, please use isHexadecimal instead', 'hexadecimal'),
            identitycard: deprecate(setup('isIdentityCard'), 'identitycard is being deprecated, please use isIdentityCard instead', 'identitycard'),
            iprange: deprecate(setup('isIPRange'), 'iprange is being deprecated, please use inIPRange instead', 'iprange'), // this only checks if its ipv4
            issn: deprecate(setup('isISSN'), 'issn is being deprecated, please use isISSN instead', 'issn'),
            isin: deprecate(setup('isISIN'), 'isin is being deprecated, please use isISIN instead', 'isin'),
            iso8601: deprecate(setup('isISO8601'), 'iso8601 is being deprecated, please use isISO8601 instead', 'iso8601'),
            iso31661alpha2: deprecate(setup('isISO31661Alpha2'), 'iso31661alpha2 is being deprecated, please use isISO31661Alpha2 instead', 'iso31661alpha2'),
            iso31661alpha3: deprecate(setup('isISO31661Alpha3'), 'iso31661alpha3 is being deprecated, please use isISO31661Alpha3 instead', 'iso31661alpha3'),
            in: deprecate(setup('isIn'), 'in is being deprecated, please use isIn instead', 'in'),
            int: deprecate(setup('isInt'), 'int is being deprecated, please use isInteger instead', 'int'),
            latlong: deprecate(setup('isLatLong'), 'latlong is being deprecated, please use isGeoPoint instead', 'latlong'), // - This is different that our internal geolocation validation.
            length: deprecate(setup('isLength'), 'length is being deprecated, please use isLength instead', 'length'),
            matches: setup('matches'),
            md5: deprecate(setup('isMD5'), 'md5 is being deprecated, please use isHash instead', 'md5'),
            mimetype: deprecate(setup('isMimeType'), 'mimetype is being deprecated, please use isMIMEType instead', 'mimetype'),
            numeric: deprecate(setup('isNumeric'), 'numeric is being deprecated, please use isNumeric instead', 'numeric'),
            port: deprecate(setup('isPort'), 'port is being deprecated, please use isPort instead', 'port'),
            postalcode: deprecate(setup('isPostalCode'), 'postalcode is being deprecated, please use isPostalCode instead', 'postalcode'),
            rfc3339: deprecate(setup('isRFC3339'), 'rfc3339 is being deprecated, please use isRFC3339 instead', 'rfc3339')
        };
    }
}
