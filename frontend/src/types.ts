interface Product {
    readonly pid: number;
    readonly productName: string;
}

interface Token {
    readonly token: string;
}

interface Transaction {
    readonly tid: number;
    readonly transactionDate: string;
    readonly product: number;
    readonly transactionCount: string;
    readonly price: string;
    readonly estimatedTotal: string;
    readonly actualTotal: string;
    readonly handler1: number;
    readonly handler2?: number;
    readonly handler3?: number;
    readonly remarks?: string;
}

interface User {
    readonly uid: number;
    readonly username: string;
    readonly isAdmin: 0 | 1;
    readonly isHandler: 0 | 1;
}

interface BackendResponse {
    readonly timestamp: string;
    readonly status: number;
    [propName: string]: any;
}

export interface ErrorResponse extends BackendResponse {
    readonly error: string;
    readonly message: string;
}

export interface LoginResponse extends BackendResponse {
    readonly payload: Token;
}

interface ProductsGetResponse extends BackendResponse {
    readonly payload: Array<Product>;
}

interface TransactionsGetResponse extends BackendResponse {
    readonly payload: Array<Transaction>;
}

interface UsersGetResponse extends BackendResponse {
    readonly payload: Array<User>;
}

export function isErrorResponse(res: BackendResponse): res is ErrorResponse {
    return typeof res?.error === 'string' && typeof res?.message === 'string';
}
