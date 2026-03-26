import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/Router';

export default function App() {
    return (
        <AppProviders>
            <AppRouter />
        </AppProviders>
    );
}
