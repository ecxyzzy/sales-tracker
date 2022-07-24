import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
    BackendResponse,
    ErrorResponse,
    isErrorResponse,
    ProductsGetResponse,
    SanitizedTransaction,
    TransactionsGetResponse,
    User,
    UsersGetResponse,
} from '../types';

const dateFmt = new Intl.DateTimeFormat();
const columns: GridColDef[] = [
    {
        field: 'transactionDate',
        headerName: 'Date',
        valueFormatter: (params) => dateFmt.format(new Date(params.value)),
        filterable: false,
    },
    {
        field: 'product',
        headerName: 'Product',
    },
    {
        field: 'transactionCount',
        headerName: 'Count',
    },
    {
        field: 'price',
        headerName: 'Price',
    },
    {
        field: 'estimatedTotal',
        headerName: 'Estimated total',
    },
    {
        field: 'actualTotal',
        headerName: 'Actual total',
    },
    {
        field: 'handler1',
        headerName: 'Handler 1',
    },
    {
        field: 'handler2',
        headerName: 'Handler 2',
    },
    {
        field: 'handler3',
        headerName: 'Handler 3',
    },
    {
        field: 'remarks',
        headerName: 'Remarks',
    },
];

async function fetchData<T extends BackendResponse>(
    endpoint: 'transactions' | 'products' | 'users',
    token: string | null,
    params?: Record<string, string>
): Promise<T | ErrorResponse> {
    return (
        await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/${endpoint}/get?${
                params ? new URLSearchParams(params).toString() : ''
            }`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
    ).json();
}

export default function SalesTable(props: { token: string | null }) {
    const [rows, setRows] = useState<SanitizedTransaction[]>([]);
    const [error, setError] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const locationState = useLocation()?.state as Record<string, string>;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = props.token ?? locationState?.token ?? localStorage.getItem('token');
    useEffect(() => {
        (async () => {
            const tRes = await fetchData<TransactionsGetResponse>('transactions', token, {
                fromDate: searchParams.get('fromDate') ?? '',
                toDate: searchParams.get('toDate') ?? '',
            });
            const pRes = await fetchData<ProductsGetResponse>('products', token);
            const uRes = await fetchData<UsersGetResponse>('users', token);
            if (!(isErrorResponse(tRes) || isErrorResponse(pRes) || isErrorResponse(uRes))) {
                setRows([]);
                for (const transaction of tRes.payload) {
                    setRows((prevState) => [
                        ...prevState,
                        {
                            ...transaction,
                            product: pRes.payload.filter((x) => x.pid === transaction.product)[0].productName,
                            handler1: uRes.payload.filter((x: User) => x.uid === transaction.handler1)[0].username,
                            handler2: uRes.payload.filter((x: User) => x.uid === transaction?.handler2)[0]?.username,
                            handler3: uRes.payload.filter((x: User) => x.uid === transaction?.handler3)[0]?.username,
                        },
                    ]);
                }
                setLoading(false);
            } else {
                if ([tRes, pRes, uRes].some((x) => x.status === 403)) {
                    localStorage.removeItem('token');
                    navigate('/login', { state: { status: 'sessionExpired' } });
                    return;
                }
                setLoading(false);
                setError(true);
                return;
            }
        })().catch((e) => {
            console.error(e);
            setLoading(false);
            setError(true);
        });
        // we only want this useEffect to run once on render, it should have no dependencies other than that
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <Box sx={{ height: '90vh', width: '100vw' }}>
            <DataGrid columns={columns} rows={rows} getRowId={(r) => r.tid} error={error} loading={loading} />
        </Box>
    );
}
