import { DataTypeMapping } from '../interfaces.js';
import BooleanV1 from './v1/boolean.js';
import DateV1 from './v1/date.js';
import GeoV1 from './v1/geo.js';
import GeoPointV1 from './v1/geo-point.js';
import GeoJSONV1 from './v1/geo-json.js';
import IPV1 from './v1/ip.js';
import IPRangeV1 from './v1/ip-range.js';
import ByteV1 from './v1/byte.js';
import DoubleV1 from './v1/double.js';
import FloatV1 from './v1/float.js';
import IntegerV1 from './v1/integer.js';
import KeywordV1 from './v1/keyword.js';
import LongV1 from './v1/long.js';
import ShortV1 from './v1/short.js';
import TextV1 from './v1/text.js';
import ObjectV1 from './v1/object.js';
import KeywordTokensV1 from './v1/keyword-tokens.js';
import HostnameV1 from './v1/hostname.js';
import DomainV1 from './v1/domain.js';
import KeywordCaseInsensitiveV1 from './v1/keyword-case-insensitive.js';
import KeywordTokensCaseInsensitiveV1 from './v1/keyword-tokens-case-insensitive.js';
import KeywordPathAnalyzerV1 from './v1/keyword-path-analyzer.js';
import NgramTokensV1 from './v1/ngram-tokens.js';
import BoundaryV1 from './v1/boundary.js';
import StringV1 from './v1/string.js';
import NumberV1 from './v1/number.js';
import AnyV1 from './v1/any.js';
import VectorV1 from './v1/vector.js';

export const mapping: DataTypeMapping = {
    1: {
        Boolean: BooleanV1,
        Date: DateV1,
        Geo: GeoV1,
        GeoPoint: GeoPointV1,
        GeoJSON: GeoJSONV1,
        IP: IPV1,
        IPRange: IPRangeV1,
        Byte: ByteV1,
        Double: DoubleV1,
        Float: FloatV1,
        Integer: IntegerV1,
        Keyword: KeywordV1,
        Long: LongV1,
        Short: ShortV1,
        Text: TextV1,
        KeywordTokens: KeywordTokensV1,
        Hostname: HostnameV1,
        Domain: DomainV1,
        KeywordCaseInsensitive: KeywordCaseInsensitiveV1,
        KeywordTokensCaseInsensitive: KeywordTokensCaseInsensitiveV1,
        KeywordPathAnalyzer: KeywordPathAnalyzerV1,
        NgramTokens: NgramTokensV1,
        Boundary: BoundaryV1,
        Object: ObjectV1,
        String: StringV1,
        Number: NumberV1,
        // we should set this to AnyV1 because it shouldn't
        // ever get here
        Tuple: AnyV1,
        Any: AnyV1,
        Vector: VectorV1
    }
};
