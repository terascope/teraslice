
import { DataTypeMapping } from '../../interfaces';

import BooleanV1 from './v1/boolean';
import DateV1 from './v1/date';
import GeoV1 from './v1/geo';
import IPV1 from './v1/ip';
import ByteV1 from './v1/byte';
import DoubleV1 from './v1/double';
import FloatV1 from './v1/float';
import IntegerV1 from './v1/integer';
import KeywordV1 from './v1/keyword';
import LongV1 from './v1/long';
import ShortV1 from './v1/short';
import TextV1 from './v1/text';
import KeywordTokensV1 from './v1/keyword-tokens';
import HostnameV1 from './v1/hostname';
import KeywordCaseInsensitiveV1 from './v1/keyword-case-insensitive';
import KeywordTokensCaseInsensitiveV1 from './v1/keyword-tokens-case-insensitive';
import NgramTokensV1 from './v1/ngram-tokens';
import BoundryV1 from './v1/boundary';

export const mapping: DataTypeMapping = {
    v1: {
        Boolean: BooleanV1,
        Date: DateV1,
        Geo: GeoV1,
        IP: IPV1,
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
        KeywordCaseInsensitive: KeywordCaseInsensitiveV1,
        KeywordTokensCaseInsensitive: KeywordTokensCaseInsensitiveV1,
        NgramTokens: NgramTokensV1,
        Boundry: BoundryV1,
    }
};
