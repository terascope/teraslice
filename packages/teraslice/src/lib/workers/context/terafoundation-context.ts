import { ProcessContext } from 'terafoundation';
import { getTerasliceConfig } from '../../config/index.js';

export async function makeTerafoundationContext({ sysconfig } = {} as any) {
    return ProcessContext.createContext(getTerasliceConfig(), sysconfig ? {
        configfile: sysconfig
    } : undefined);
}
