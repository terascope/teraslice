import React, { useState } from 'react';
import { Modal, Button, Header, Icon } from 'semantic-ui-react';

const ConfirmRemoval: React.FC<Props> = ({ children, numSelected, onConfirm }) => {
    const [open, setOpen] = useState(false);

    return (
        <Modal
            trigger={children}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            open={open}
            size="tiny"
        >
            <Header icon="trash alternate" content="Remove records" />
            <Modal.Content>
                <p>Are you sure you want to remove {numSelected} records</p>
            </Modal.Content>
            <Modal.Actions>
                <Button basic onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button
                    color="red"
                    onClick={() => {
                        setOpen(false);
                        onConfirm();
                    }}
                >
                    <Icon name="remove" /> Yes
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

type Props = {
    numSelected: number;
    onConfirm: () => void;
};

export default ConfirmRemoval;
