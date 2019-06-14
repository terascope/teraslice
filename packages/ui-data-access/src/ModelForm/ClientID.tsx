import React from 'react';
import PropTypes from 'prop-types';
import { toInteger } from '@terascope/utils';
import { useCoreContext } from '@terascope/ui-components';
import { AnyModel, DefaultInputProps } from './interfaces';
import { FormInputProps } from 'semantic-ui-react';
import FormInput from './FormInput';

function ClientID<T extends AnyModel>({
    id,
    inherited,
    disabled: overrideDisabled,
    ...props
}: Props & DefaultInputProps<T>): React.ReactElement {
    const authUser = useCoreContext().authUser!;
    let disabled = false;

    const clientId = toInteger(id) || 0;
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
                    value={id != null ? `${id}` : ''}
                    name="client_id"
                    label="Client ID"
                />
            )}
        </React.Fragment>
    );
}

type Props = {
    id: number;
    inherited?: boolean;
} & FormInputProps;

ClientID.propTypes = {
    id: PropTypes.number.isRequired,
    inherited: PropTypes.bool,
};

export default ClientID;
