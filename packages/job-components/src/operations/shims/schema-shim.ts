import { Context, LegacyProcessor, ValidatedJobConfig } from '../../interfaces/index.js';
import ConvictSchema from '../convict-schema.js';
import { SchemaModule } from '../interfaces.js';

export default function schemaShim<S extends Record<string, any>>(
    legacy: LegacyProcessor
): SchemaModule {
    return {
        Schema: class LegacySchemaShim extends ConvictSchema<S> {
            // @ts-expect-error
            validate(inputConfig: any) {
                const opConfig = super.validate(inputConfig);
                if (legacy.selfValidation) {
                    // @ts-expect-error
                    legacy.selfValidation(opConfig);
                }
                return opConfig;
            }

            validateJob(job: ValidatedJobConfig): void {
                if (legacy.crossValidation) {
                    legacy.crossValidation(job, this.context.sysconfig);
                }
            }

            build(context?: Context) {
                return legacy.schema(context);
            }
        }
    };
}
