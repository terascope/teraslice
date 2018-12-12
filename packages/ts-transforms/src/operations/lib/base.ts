
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../interfaces'

export default abstract class OperationBase {
    //@ts-ignore
    protected source: string;

    protected validate(config: OperationConfig) {
        const { target_field: field } = config;
        if (!field || typeof field !== 'string' || field.length === 0) throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        const source = this.parseField(field);
        this.source = source;
    }

    protected parseField(str: string): string {
       return str.lastIndexOf('.') === -1 ?
       str : str.slice(0, str.lastIndexOf('.'));
    }

    abstract run(data: DataEntity | null): null | DataEntity
}
