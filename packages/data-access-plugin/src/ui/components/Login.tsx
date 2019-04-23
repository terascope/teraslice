import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
    button: {
        margin: theme.spacing.unit,
    },
});

type LoginState = {
    username?: string;
    password?: string;
};

type LoginProps = {
    classes: any;
    login: (username: string, password: string) => void;
};

class Login extends React.Component<LoginProps, LoginState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        login: PropTypes.func.isRequired,
    };

    state: LoginState = {};

    handleChange = (name: 'username'|'password') => (event: any) => {
        this.setState({ [name]: event.target.value });
    }

    handleSubmit = () => {
        this.setState((state) => {
            this.props.login(state.username, state.password);
            return { username: undefined, password: undefined };
        });
    }

    render() {
        const { classes } = this.props;
        const { username, password } = this.state;

        return (
            <div>
                <Paper className={classes.root} elevation={1}>
                    <Typography variant="h4" component="h4" align="center">
                        Login
                    </Typography>
                    <form className={classes.container}>
                        <TextField
                            id="standard-name"
                            label="Username"
                            className={classes.textField}
                            value={username}
                            onChange={this.handleChange('username')}
                            margin="normal"
                        />
                        <TextField
                            id="standard-password-input"
                            label="Password"
                            className={classes.textField}
                            type="password"
                            value={password}
                            onChange={this.handleChange('password')}
                            margin="normal"
                        />
                        <Button color="primary" className={classes.button} onClick={this.handleSubmit}>
                            Login
                        </Button>
                    </form>
                </Paper>
            </div>
        );
    }
}

export default withStyles(styles)(Login);
