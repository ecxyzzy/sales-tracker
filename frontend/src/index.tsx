import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './components/App';
import Login from './components/Login';
import Logout from './components/Logout';
import Navbar from './components/Navbar';
import SalesTable from './components/SalesTable';
import appTheme from './themes/appTheme';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={appTheme}>
            <SnackbarProvider autoHideDuration={1000} maxSnack={3}>
                <CssBaseline enableColorScheme />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route
                            path="/salesTable"
                            element={
                                <>
                                    <Navbar />
                                    <SalesTable token={null} />
                                </>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </SnackbarProvider>
        </ThemeProvider>
    </React.StrictMode>
);
