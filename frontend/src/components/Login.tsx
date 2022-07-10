import { Alert, Snackbar } from '@mui/material';
import React, { useState } from 'react';
import { ErrorResponse, isErrorResponse, LoginResponse } from '../types';

export default function Login(props: { setToken: (token: string) => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const loginUser = async (username: string, password: string): Promise<ErrorResponse | LoginResponse> => {
        return fetch(`${process.env.REACT_APP_BACKEND_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        }).then((res) => res.json());
    };

    const handleClose = () => {
        setLoginError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await loginUser(username, password);
        if (isErrorResponse(res)) {
            setLoginError(res.message);
            setUsername('');
            setPassword('');
        } else {
            props.setToken(res.payload.token);
        }
    };

    return (
        <>
            <div className="loginWrapper">
                <h1>Log in</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Username</p>
                        <input type="text" onChange={(e) => setUsername(e.target.value)} />
                    </label>
                    <label>
                        <p>Password</p>
                        <input type="password" onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    <div>
                        <button type="submit">Submit</button>
                    </div>
                </form>
            </div>
            <Snackbar open={Boolean(loginError)} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                    Failed to login: {loginError}
                </Alert>
            </Snackbar>
        </>
    );
}
