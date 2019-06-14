import React from 'react';
import PropTypes from 'prop-types';
import { Table, Pagination, Dropdown, Label } from 'semantic-ui-react';
import { UpdateQueryState } from './interfaces';
import { uniqIntArray } from './utils';

const TableFooter: React.FC<{ numCols: number }> = ({ numCols, children }) => {
    return (
        <Table.Footer fullWidth>
            <Table.Row>
                <Table.HeaderCell />
                <Table.HeaderCell colSpan={numCols - 1}>
                    {children}
                </Table.HeaderCell>
            </Table.Row>
        </Table.Footer>
    );
};

const Footer: React.FC<Props> = ({
    total,
    size,
    from,
    numCols,
    updateQueryState,
}) => {
    const totalPages = Math.ceil(total / size);
    const currentPage = Math.floor(from / size) + 1;

    const rowsPerPageOptions = uniqIntArray([1, 5, 10, 25, size]).map(num => ({
        key: num,
        text: num,
        value: num,
    }));

    return (
        <TableFooter numCols={numCols}>
            <div className="dtFooterCell">
                <div className="dtFooterResults">Found {total} results</div>
                <div className="dtFooterOptions">
                    <Label basic className="dtFooterPerPageLabel">
                        Per Page
                    </Label>
                    <Dropdown
                        className="dtFooterPerPage"
                        placeholder="Per Page"
                        compact
                        selection
                        value={size}
                        options={rowsPerPageOptions}
                        onChange={(e, { value }) => {
                            updateQueryState({ size: value as number });
                        }}
                    />
                    <Pagination
                        disabled={total < size}
                        boundaryRange={0}
                        defaultActivePage={currentPage}
                        ellipsisItem={null}
                        firstItem={null}
                        lastItem={null}
                        siblingRange={1}
                        onPageChange={(e: any, data: any) => {
                            const { activePage = 1 } = data;
                            const newFrom = (activePage - 1) * size;
                            updateQueryState({
                                from: newFrom,
                            });
                        }}
                        totalPages={totalPages}
                        size="small"
                    />
                </div>
            </div>
        </TableFooter>
    );
};

type Props = {
    total: number;
    size: number;
    from: number;
    numCols: number;
    updateQueryState: UpdateQueryState;
};

Footer.propTypes = {
    total: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    from: PropTypes.number.isRequired,
    numCols: PropTypes.number.isRequired,
    updateQueryState: PropTypes.func.isRequired,
};

export default Footer;
