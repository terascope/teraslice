
import _ from 'lodash';
import OperationBase from './lib/base';
import Join from './lib/ops/join';
import Selector from './lib/ops/selector';
import Extraction  from './lib/ops/extraction';
import Base64Decode from './lib/ops/base64decode';
import UrlDecode from './lib/ops/urldecode';
import HexDecode from './lib/ops/hexdecode';
import Geolocation from './lib/validations/geolocation';
import StringValidation from './lib/validations/string';
import NumberValidation from './lib/validations/number';
import BooleanValidation from './lib/validations/boolean';
import Url from './lib/validations/url';
import Email from './lib/validations/email';
import Ip from './lib/validations/ip';
import MacAddress from './lib/validations/mac_address';
import Uuid from './lib/validations/uuid';
import PhoneNumber from './lib/validations/phone_number';
import RequiredExtractions from './lib/validations/required_extractions';
import { Validator, ValidatorPlugins } from './lib/validations/validator';
import { OperationsDict, PluginClassType, BaseOperationClass, PluginList } from '../interfaces';

class CorePlugins implements PluginClassType {
    init(): OperationsDict {
        return {
            join: Join,
            selector: Selector,
            extraction: Extraction,
            geolocation: Geolocation,
            string: StringValidation,
            boolean: BooleanValidation,
            number: NumberValidation,
            url: Url,
            email: Email,
            ip: Ip,
            base64decode: Base64Decode,
            urldecode: UrlDecode,
            hexdecode: HexDecode,
            requiredExtractions: RequiredExtractions,
            macaddress: MacAddress,
            phonenumber: PhoneNumber,
            uuid: Uuid,
        };
    }
}

class OperationsManager {
    operations: OperationsDict;

    constructor(pluginList: PluginList = []) {
        pluginList.push(CorePlugins);
        // @ts-ignore FIXME: try to remove this ignore
        pluginList.push(ValidatorPlugins);
        const operations = pluginList.reduce((plugins, PluginClass) => {
            const plugin = new PluginClass();
            const pluginOps = plugin.init();
            _.assign(plugins, pluginOps);
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
    RequiredExtractions,
    OperationsManager,
    MacAddress,
    Uuid,
    PhoneNumber,
    Validator,
    CorePlugins
};
