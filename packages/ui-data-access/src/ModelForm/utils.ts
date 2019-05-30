import { toInteger, get } from '@terascope/utils';
import { ErrorsState } from './interfaces';

export function validateClientId<T extends { client_id: string | number }>(errs: ErrorsState<T>, model: T): ErrorsState<T> {
    const clientId = toInteger(model.client_id);
    if (get(model, 'type') === 'SUPERADMIN') {
        model.client_id = 0;
    } else if (clientId === false || clientId < 1) {
        errs.messages.push('Client ID must be an valid number greater than zero');
        errs.fields.push('client_id');
    } else {
        model.client_id = clientId;
    }
    return errs;
}
