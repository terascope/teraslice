import { DataTypeMapping } from '../interfaces';
import BooleanV1 from './v1/boolean';
import DateV1 from './v1/date';
import GeoV1 from './v1/geo';
import GeoPointV1 from './v1/geo-point';
import GeoJSONV1 from './v1/geo-json';
import IPV1 from './v1/ip';
import IPRangeV1 from './v1/ip-range';
import ByteV1 from './v1/byte';
import DoubleV1 from './v1/double';
import FloatV1 from './v1/float';
import IntegerV1 from './v1/integer';
import KeywordV1 from './v1/keyword';
import LongV1 from './v1/long';
import ShortV1 from './v1/short';
import TextV1 from './v1/text';
import ObjectV1 from './v1/object';
import KeywordTokensV1 from './v1/keyword-tokens';
import HostnameV1 from './v1/hostname';
import DomainV1 from './v1/domain';
import KeywordCaseInsensitiveV1 from './v1/keyword-case-insensitive';
import KeywordTokensCaseInsensitiveV1 from './v1/keyword-tokens-case-insensitive';
import KeywordPathAnalyzerV1 from './v1/keyword-path-analyzer';
import NgramTokensV1 from './v1/ngram-tokens';
import BoundaryV1 from './v1/boundary';
import StringV1 from './v1/string';
import NumberV1 from './v1/number';
import AnyV1 from './v1/any';

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
        Any: AnyV1
    },
};
