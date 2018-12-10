
import { DataEntity } from '@terascope/job-components';

export default abstract class PhaseBase {
    abstract run(data: DataEntity[]): DataEntity[]
}
