import { ProcessContext } from 'terafoundation';
import { getTerasliceConfig } from '../../config/index.js';
import { safeDecode } from '../../utils/encoding_utils.js';

export async function makeTerafoundationContext({ sysconfig } = {} as any) {
    const extraLoggerFields: Record<string, any> = {};

    if (process.env.EX) {
        try {
            const ex = safeDecode(process.env.EX);
            if (ex?.ex_id) extraLoggerFields.ex_id = ex.ex_id;
            if (ex?.job_id) extraLoggerFields.job_id = ex.job_id;
        } catch (_err) {
            // an invalid ex will be caught and thrown
            // with a proper error message by _getExecutionConfigFromEnv()
            // after context creation, where a logger is available.
        }
    }

    return ProcessContext.createContext(
        getTerasliceConfig({ extraLoggerFields }),
        sysconfig ? { configfile: sysconfig } : undefined
    );
}
