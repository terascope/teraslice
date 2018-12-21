
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import * as Ops from '../operations';
import _ from 'lodash';

export default class SelectionPhase extends PhaseBase {
    private opConfig: WatcherConfig;
    readonly selectionPhase: Ops.Selector[];

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();
        this.opConfig = opConfig;
        const selectionPhase: Ops.Selector[] = [];
        const dict = {};
        _.forEach(configList, (config: OperationConfig) => {
            if (config.selector && !config.follow && !config.other_match_required) dict[config.selector] = true;
        });
        _.forOwn(dict, (_value, selector) => selectionPhase.push(new Ops.Selector({ selector }, this.opConfig.selector_config)));
        this.selectionPhase = selectionPhase;
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.selectionPhase.length > 0) {
            return data.reduce<DataEntity[]>((results, record) => {
                _.each(this.selectionPhase, selectorOp => selectorOp.run(record));
                const recordMeta = record.getMetadata('selectors');
                if (recordMeta) {
                    results.push(record);
                }
                return results;
            }, []);
        }

        return [];
    }
}
