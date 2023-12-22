import { ProcessContext } from 'terafoundation';
import { getTerasliceConfig } from '../../config/index.js';

export function makeTerafoundationContext({ sysconfig } = {} as any) {
    // @ts-expect-error
    return new ProcessContext(getTerasliceConfig(), sysconfig ? {
        configfile: sysconfig
    } : undefined);
}
