import { Context, LegacyProcessor, ValidatedJobConfig } from '../../interfaces';
import ConvictSchema from '../convict-schema';
import { SchemaModule } from '../interfaces';

export default function schemaShim<S = any>(legacy: LegacyProcessor): SchemaModule {
    return {
        Schema: class LegacySchemaShim extends ConvictSchema<S> {
            // @ts-ignore
            validate(inputConfig: any) {
                const opConfig = super.validate(inputConfig);
                if (legacy.selfValidation) {
                    // @ts-ignore
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
