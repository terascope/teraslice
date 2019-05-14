import React from 'react';
import PropTypes from 'prop-types';
import { Table, Pagination } from 'semantic-ui-react';
import { UpdateQueryState } from './interfaces';

const TableFooter: React.FC<{ numCols: number }> = ({ numCols, children }) => {
    return (
        <Table.Footer fullWidth>
            <Table.Row>
                <Table.HeaderCell />
                <Table.HeaderCell colSpan={numCols - 1}>{children}</Table.HeaderCell>
            </Table.Row>
        </Table.Footer>
    );
};

const Footer: React.FC<Props> = ({ total, size, from, numCols, updateQueryState }) => {
    const totalPages = Math.ceil(total / size);
    const currentPage = Math.floor(from / size) + 1;

    // FIXME
    // const rowsPerPageOptions = utils.uniqIntArray([1, 5, 10, 25, queryState.size]);

    return (
        <TableFooter numCols={numCols}>
            <div className="dtFooterCell">
                <div className="dtFooterResults">Found {total} results</div>
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
