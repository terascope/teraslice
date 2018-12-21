
import OperationBase from './lib/base';
import Join from './lib/ops/join';
import Selector from './lib/ops/selector';
import Extraction  from './lib/ops/extraction';
import Geolocation from './lib/validations/geolocation';
import String from './lib/validations/string';
import Number from './lib/validations/number';
import Boolean from './lib/validations/boolean';
import Url from './lib/validations/url';
import Email from './lib/validations/email';
import Ip from './lib/validations/ip';
import Base64Decode from './lib/ops/base64decode';
import UrlDecode from './lib/ops/urldecode';
import HexDecode from './lib/ops/hexdecode';
import RequiredExtractions from './lib/validations/required_extractions';

const opNames = {
    join: Join,
    selector: Selector,
    extraction: Extraction,
    geolocation: Geolocation,
    string: String,
    boolean: Boolean,
    number: Number,
    url: Url,
    email: Email,
    ip: Ip,
    base64decode: Base64Decode,
    urldecode: UrlDecode,
    hexdecode: HexDecode,
    requiredExtractions: RequiredExtractions
};

export {
    OperationBase,
    Join,
    Selector,
    Extraction,
    Geolocation,
    String,
    Number,
    Boolean,
    Url,
    Email,
    Ip,
    Base64Decode,
    UrlDecode,
    HexDecode,
    RequiredExtractions,
    opNames
};
