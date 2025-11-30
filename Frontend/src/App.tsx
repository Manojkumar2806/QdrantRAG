import { useState } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Features from './pages/Features';
import Demo from './pages/Demo';
import Technology from './pages/Technology';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import FileChatPro from "./pages/FileChatPro";
import SosPage from "./pages/SosPage"; // <-- add this import

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'features':
        return <Features />;
      case 'demo':
        return <Demo />;
      case 'technology':
        return <Technology />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
      case 'contact':
        return <Contact />;
      case 'filechatpro':
        return <FileChatPro />;
      case 'privacy':
        return <Privacy />;
      case 'sos':                        {/* <-- new case */}
        return <SosPage />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
