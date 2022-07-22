import React from 'react';
import { AppBar, Container, Toolbar } from '@mui/material';

export default function Navbar() {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                </Toolbar>
            </Container>
        </AppBar>
    )
}
