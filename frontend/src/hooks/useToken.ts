import { useEffect, useState } from 'react';

export default function useToken() {
    useEffect(() => {
        async function getToken(): Promise<string | null> {
            const token = localStorage.getItem('token');
            if (!token) return new Promise<null>(() => null);
            return (
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/verify`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ).status === 200
                ? token
                : null;
        }
        if (!token) {
            getToken().then((r) => setToken(r));
        }
    });

    const saveToken = (token: string): void => {
        localStorage.setItem('token', token);
    };

    const [token, setToken] = useState<string | null>('');

    return { token, setToken: saveToken };
}
