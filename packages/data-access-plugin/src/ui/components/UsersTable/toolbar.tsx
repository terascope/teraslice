import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import Toolbar from '@material-ui/core/Toolbar';
import DeleteIcon from '@material-ui/icons/Delete';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FilterListIcon from '@material-ui/icons/FilterList';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import { Theme, createStyles, withStyles } from '@material-ui/core/styles';

const toolbarStyles = (theme: Theme) => createStyles({
    root: {
        paddingRight: theme.spacing.unit,
    },
    highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
      }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
      },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        paddingTop: theme.spacing.unit,
        paddingRight: theme.spacing.unit,
        paddingBottom: theme.spacing.unit,
        paddingLeft: theme.spacing.unit * 10,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: 200,
        },
    },
});

type UsersTableToolbarProps = {
    classes: any;
    title: string;
    selected: string[];
    query?: string;
    onQueryFilter: (query: string) => void
    onRemoveSelection: (ids: string[]) => void
};

type UsersTableToolbarState = {
    query: string;
};

class UsersTableToolbar extends React.Component<UsersTableToolbarProps, UsersTableToolbarState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        selected: PropTypes.array.isRequired,
        title: PropTypes.string.isRequired,
        query: PropTypes.string,
        onRemoveSelection: PropTypes.func.isRequired,
        onQueryFilter: PropTypes.func.isRequired
    };

    state = {
        query: '',
    };

    handleQueryFilterChange = (event: any) => {
        if (!event.target.value) return;

        this.setState({ query: event.target.value });
    }

    handleQueryFilterKeypress = (event: any) => {
        if (event.key === 'Enter') {
            this.submitQueryChange();
        }
    }

    submitQueryChange = () => {
        const query = this.state.query || this.props.query;
        this.props.onQueryFilter(query);
    }

    handleRemoveSelection = (event: any) => {
        this.props.onRemoveSelection(this.props.selected);
    }

    render() {
        const { selected, classes, title } = this.props;
        const query = this.state.query || this.props.query;

        return (
            <Toolbar
                className={classNames(classes.root, {
                    [classes.highlight]: selected.length > 0,
                })}
            >
                <div className={classes.title}>
                    {selected.length > 0 ? (
                        <Typography color="inherit" variant="subtitle1">
                            {selected.length} selected
                        </Typography>
                        ) : (
                        <Typography variant="h6" id="tableTitle">
                            {title}
                        </Typography>
                    )}
                </div>
                <div className={classes.spacer} />
                <InputBase
                    placeholder={`Search ${title}...`}
                    onKeyPress={this.handleQueryFilterKeypress}
                    onChange={this.handleQueryFilterChange}
                    defaultValue={query}
                    classes={{
                        root: classes.inputRoot,
                        input: classes.inputInput,
                    }}
                />
                <IconButton
                    className={classes.iconButton}
                    onClick={this.submitQueryChange}
                    aria-label="Search"
                >
                    <SearchIcon />
                </IconButton>
                <div className={classes.actions}>
                    <Tooltip title={`Delete ${!selected.length ? '(disabled)' : ''}`}>
                        <div>
                            <IconButton
                                disabled={!selected.length}
                                onClick={this.handleRemoveSelection}
                                aria-label="Delete"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                </div>
            </Toolbar>
        );
    }
}

export default withStyles(toolbarStyles)(UsersTableToolbar);
