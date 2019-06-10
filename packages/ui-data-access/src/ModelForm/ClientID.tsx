import React from 'react';
import PropTypes from 'prop-types';
import { useCoreContext } from '@terascope/ui-components';
import { AnyModel, DefaultInputProps } from './interfaces';
import { FormInputProps } from 'semantic-ui-react';
import FormInput from './FormInput';
import { toInteger } from '@terascope/utils';

function ClientID<T extends AnyModel>({
    client_id,
    inherited,
    disabled: overrideDisabled,
    ...props
}: Props & DefaultInputProps<T>): React.ReactElement {
    const authUser = useCoreContext().authUser!;
    let disabled = false;

    const clientId = toInteger(client_id) || 0;
    if (overrideDisabled) {
        disabled = overrideDisabled;
    } else if (inherited && clientId) {
        disabled = true;
    }

    return (
        <React.Fragment>
            {authUser.type === 'SUPERADMIN' && (
                <FormInput<T>
                    {...props}
                    disabled={disabled}
                    value={client_id != null ? `${clientId}` : ''}
                    name="client_id"
                    label="Client ID"
                />
            )}
        </React.Fragment>
    );
}

type Props = {
    client_id: number;
    inherited?: boolean;
} & FormInputProps;

ClientID.propTypes = {
    client_id: PropTypes.number.isRequired,
    inherited: PropTypes.bool,
};

export default ClientID;
