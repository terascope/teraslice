

import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import * as Ops from '../operations';
import _ from 'lodash';

export default class SelectionPhase implements PhaseBase {
    private opConfig: WatcherConfig;
    private selectionPhase: Ops.Selector[];

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]) {
        this.opConfig = opConfig;
        const selectionPhase: Ops.Selector[] = [];
        const dict = {};
        _.forEach(configList, (config: OperationConfig) => {
            if (config.selector && !config.refs) dict[config.selector] = config
        });
        _.forOwn(dict, (config, _selector) => selectionPhase.push(new Ops.Selector(config, this.opConfig.selector_config)))
        this.selectionPhase = selectionPhase;
    }

    public run(data: DataEntity[]): DataEntity[] {
        const { selectionPhase }  = this;

        if (selectionPhase.length > 0) {
            return data.reduce<DataEntity[]>((results, record) => {
                _.each(selectionPhase, selectorOp => selectorOp.run(record))
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
