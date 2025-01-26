import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import WelcomePage from "./WelcomePage";
import RedirectButton from './RedirectButton';


export default function App() {
    const location = useLocation();
    return (
        <>
            {location.pathname !== "/Home" && (
                //<nav>
                <>
                    <WelcomePage />
                    <Link to="/Home"><RedirectButton /></Link>
                </>
                //</nav>
            )}

            <Routes>
                <Route path='/Home' element={<Home />} />
            </Routes>
        </>
    )
}