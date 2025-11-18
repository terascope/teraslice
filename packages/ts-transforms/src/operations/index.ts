import { deprecate } from 'util';
import OperationBase from './lib/base.js';
import TransformOpBase from './lib/transforms/base.js';
import ValidationOpBase from './lib/validations/base.js';
import Join from './lib/transforms/join.js';
import Selector from './lib/transforms/selector.js';
import Extraction from './lib/transforms/extraction.js';
import Base64Decode from './lib/transforms/base64decode.js';
import UrlDecode from './lib/transforms/urldecode.js';
import HexDecode from './lib/transforms/hexdecode.js';
import JsonParse from './lib/transforms/jsonparse.js';
import Lowercase from './lib/transforms/lowercase.js';
import Uppercase from './lib/transforms/uppercase.js';
import MakeArray from './lib/transforms/array.js';
import Dedup from './lib/transforms/dedup.js';
import Trim from './lib/transforms/trim.js';
import Base64Encode from './lib/transforms/base64encode.js';
import UrlEncode from './lib/transforms/urlencode.js';
import HexEncode from './lib/transforms/hexencode.js';
import Md5Encode from './lib/transforms/md5encode.js';
import Sha1Encode from './lib/transforms/sha1encode.js';
import Sha2Encode from './lib/transforms/sha2encode.js';
import Geolocation from './lib/validations/geolocation.js';
import StringValidation from './lib/validations/string.js';
import NumberValidation from './lib/validations/number.js';
import BooleanValidation from './lib/validations/boolean.js';
import Url from './lib/validations/url.js';
import Email from './lib/validations/email.js';
import Ip from './lib/validations/ip.js';
import MacAddress from './lib/validations/mac-address.js';
import Uuid from './lib/validations/uuid.js';
import ISDN from './lib/validations/isdn.js';
import { Validator, ValidatorPlugins } from './plugins/validator/index.js';
import dataMatePlugin from './plugins/data-mate/index.js';

import {
    OperationsDict, PluginClassType, BaseOperationClass, PluginList
} from '../interfaces.js';

class CorePlugins implements PluginClassType {
    init(): OperationsDict {
        return {
            join: Join,
            selector: Selector,
            extraction: Extraction,
            geolocation: deprecate(Geolocation, 'geolocation is being deprecated, please use isGeoPoint instead', 'geolocation'),
            string: deprecate(StringValidation, 'string is being deprecated, please use isString instead', 'string'),
            boolean: deprecate(BooleanValidation, 'boolean is being deprecated, please use isBoolean instead', 'boolean'),
            number: deprecate(NumberValidation, 'number is being deprecated, please use isNumber instead', 'number'),
            url: deprecate(Url, 'url is being deprecated, please use isURL instead', 'url'),
            email: deprecate(Email, 'email is being deprecated, please use isEmail instead', 'email'),
            ip: deprecate(Ip, 'ip is being deprecated, please use isIP instead', 'ip'),
            base64decode: deprecate(Base64Decode, 'base64decode is being deprecated, please use decodeBase64 instead', 'base64decode'),
            urldecode: deprecate(UrlDecode, 'urldecode is being deprecated, please use decodeURL instead', 'urldecode'),
            hexdecode: deprecate(HexDecode, 'hexdecode is being deprecated, please use decodeHex instead', 'hexdecode'),
            macaddress: deprecate(MacAddress, 'macaddress is being deprecated, please use isMACAddress instead', 'macaddress'),
            isdn: deprecate(ISDN, 'isdn is being deprecated, please use isISDN instead', 'isdn'),
            uuid: deprecate(Uuid, 'uuid is being deprecated, please use isUUID instead', 'uuid'),
            jsonparse: deprecate(JsonParse, 'jsonparse is being deprecated, please use parseJSON instead', 'jsonparse'),
            lowercase: deprecate(Lowercase, 'lowercase is being deprecated, please use toLowerCase instead', 'lowercase'),
            uppercase: deprecate(Uppercase, 'uppercase is being deprecated, please use toUpperCase instead', 'uppercase'),
            array: MakeArray,
            dedup: deprecate(Dedup, 'dedup is being deprecated, please use dedupe instead', 'dedup'),
            trim: deprecate(Trim, 'trim from ts-transforms is being deprecated, please use trim from data-mate instead', 'trim'),
            base64encode: deprecate(Base64Encode, 'base64encode is being deprecated, please use encodeBase64 instead', 'base64encode'),
            urlencode: deprecate(UrlEncode, 'urlencode is being deprecated, please use encodeURL instead', 'urlencode'),
            hexencode: deprecate(HexEncode, 'hexencode is being deprecated, please use encodeHex instead', 'hexencode'),
            md5encode: deprecate(Md5Encode, 'md5encode is being deprecated, please use encodeMD5 instead', 'md5encode'),
            sha1encode: deprecate(Sha1Encode, 'sha1encode is being deprecated, please use encodeSHA1 instead', 'sha1encode'),
            sha2encode: deprecate(Sha2Encode, 'sha2encode is being deprecated, please use encodeSHA instead', 'sha2encode'),
        };
    }
}

class OperationsManager {
    operations: OperationsDict;

    constructor(pluginList: PluginList = []) {
        pluginList.push(CorePlugins);
        // @ts-expect-error FIXME: try to remove this ignore
        pluginList.push(ValidatorPlugins);
        pluginList.push(dataMatePlugin);

        const operations = pluginList.reduce((plugins, PluginClass) => {
            const plugin = new PluginClass();
            const pluginOps = plugin.init();
            Object.assign(plugins, pluginOps);
            return plugins;
        }, {});

        this.operations = operations;
    }

    getTransform(name: string): BaseOperationClass {
        const op = this.operations[name];
        if (!op) throw new Error(`could not find transform module ${name}`);
        return op;
    }
}

export {
    OperationBase,
    TransformOpBase,
    ValidationOpBase,
    Join,
    Selector,
    Extraction,
    Geolocation,
    StringValidation,
    NumberValidation,
    BooleanValidation,
    Url,
    Email,
    Ip,
    Base64Decode,
    UrlDecode,
    HexDecode,
    OperationsManager,
    MacAddress,
    Uuid,
    ISDN,
    Validator,
    CorePlugins,
    JsonParse,
    Lowercase,
    Uppercase,
    MakeArray,
    Dedup,
    Trim,
    Base64Encode,
    UrlEncode,
    HexEncode,
    Md5Encode,
    Sha1Encode,
    Sha2Encode
};
