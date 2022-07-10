import useToken from '../hooks/useToken';
import Login from './Login';

export default function App() {
    const { token, setToken } = useToken();
    if (!token) {
        return <Login setToken={setToken} />;
    }
    return (
        <>
            <h1>Application</h1>
        </>
    );
}
