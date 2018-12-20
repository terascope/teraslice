
import OperationBase from './lib/base';
import Join from './lib/ops/join';
import Selector from './lib/ops/selector';
import Transform  from './lib/ops/transform';
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
import RequiredTransforms from './lib/validations/requiredtransforms';

const opNames = {
    join: Join,
    selector: Selector,
    transform: Transform,
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
    requiredtransforms: RequiredTransforms
};

export {
    OperationBase,
    Join,
    Selector,
    Transform,
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
    RequiredTransforms,
    opNames
};
