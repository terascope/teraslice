
import BooleanV1 from './v1/boolean';
import DateV1 from './v1/date';
import GeoV1 from './v1/geo';
import IPV1 from './v1/ip';
import ByteV1 from './v1/byte';
import DoubleV1 from './v1/double';
import FloatV1 from './v1/float';
import HalfFloatV1 from './v1/half-float';
import IntegerV1 from './v1/integer';
import KeywordV1 from './v1/keyword';
import LongV1 from './v1/long';
import ScaledFloatV1 from './v1/scaled-float';
import ShortV1 from './v1/short';
import TextV1 from './v1/text';

export default {
    v1: {
        boolean: BooleanV1,
        date: DateV1,
        geo: GeoV1,
        ip: IPV1,
        byte: ByteV1,
        double: DoubleV1,
        float: FloatV1,
        half_float: HalfFloatV1,
        integer: IntegerV1,
        keyword: KeywordV1,
        long: LongV1,
        scaled_float: ScaledFloatV1,
        short: ShortV1,
        text: TextV1,
    }
};
