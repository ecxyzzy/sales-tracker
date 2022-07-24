import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ErrorResponse, isErrorResponse, LoginResponse } from '../types';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const locationState = useLocation()?.state as Record<string, string>;
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const token = localStorage.getItem('token');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await loginUser(username, password);
        if (isErrorResponse(res)) {
            enqueueSnackbar(`Failed to log in: ${res.message}`, { variant: 'error' });
        } else {
            localStorage.setItem('token', res.payload.token);
            navigate('/', { replace: true, state: { status: 'success' } });
        }
    };

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

    if (token) {
        return <Navigate to="/" state={{ status: 'alreadyLoggedIn' }} />;
    }
    switch (locationState?.status) {
        case 'loggedOut':
            enqueueSnackbar('Logged out successfully!', { variant: 'success' });
            break;
        case 'notLoggedIn':
            enqueueSnackbar('You must log in to access this application.', { variant: 'error' });
            break;
        case 'sessionExpired':
            enqueueSnackbar('Your session has expired. Please log in again.', { variant: 'info' });
    }
    if (locationState) {
        locationState.status = '';
    }

    return (
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
    );
}
