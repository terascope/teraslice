import { PublishType } from './interfaces';
import signale from '../signale';

export async function publish(type: PublishType) {
    signale.debug(`publish type ${type}`);
}
