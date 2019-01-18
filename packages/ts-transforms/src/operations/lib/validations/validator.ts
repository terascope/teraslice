import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import validator from 'validator';
import OperationBase from '../base';
import { OperationConfig, PluginClassType, /*OperationsDict*/ } from '../../../interfaces';

export class Validator extends OperationBase {
    private method: string;
    private value: any;
    private config: OperationConfig;

    constructor(config: OperationConfig, method: string) {
        super(config);
        this.method = method;
        this.value = config.value;
        this.config = config;
    }

    run(doc: DataEntity): DataEntity | null {
        const data = _.get(doc, this.source);
        const args = this.value || this.config;

        if (data === undefined) return doc;
        try {
            if (!validator[this.method](data, args)) _.unset(doc, this.source);
        } catch (err) {
            _.unset(doc, this.source);
        }
        return doc;
    }
}

function setup(method: string) {
    return class ValidatorInterface {
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
            iprange: setup('isIPRange'), // TODO: is this needed? its only ipv4
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
            // NORMALIZATION: isLowercase(str) TODO: do this
            md5: setup('isMD5'),
            mimetype: setup('isMimeType'),
            numeric: setup('isNumeric'), // TODO:???
            port: setup('isPort'),
            postalcode: setup('isPostalCode'),
            // NORMALIZATION : isUppercase(str) TODO: do it
            matches: setup('matches')
        };
    }
}
