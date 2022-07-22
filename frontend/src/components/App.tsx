import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import Navbar from './Navbar';
import SalesTable from './SalesTable';

export default function App() {
    const token = localStorage.getItem('token');
    const locationState = useLocation()?.state as Record<string, string>;
    const { enqueueSnackbar } = useSnackbar();
    if (!token) {
        return <Navigate to="/login" state={{ status: 'notLoggedIn' }} />;
    }
    switch (locationState?.status) {
        case 'success':
            enqueueSnackbar('Logged in successfully!', { variant: 'success' });
            break;
        case 'alreadyLoggedIn':
            enqueueSnackbar('You are already logged in.', { variant: 'info' });
            break;
    }
    if (locationState) {
        locationState.status = '';
    }
    return (
        <>
            <Navbar />
            <SalesTable token={token} />
        </>
    );
}
