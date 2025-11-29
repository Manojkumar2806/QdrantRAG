// src/components/Navigation.tsx
import { useState } from 'react';
import { Menu, X, Brain } from 'lucide-react';

// IMPORT TRANSLATOR COMPONENTS
// Make sure these files exist: src/Translator/TranslateWidget.jsx and src/Translator/CustomLangSelect.jsx
import TranslateWidget from '../Translator/TranslateWidget';
import CustomLangSelect from '../Translator/CustomLangSelect';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'demo', label: 'Demo' },
  { id: 'technology', label: 'Technology' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'filechatpro', label: 'FileChatPro' },
];

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <button
            onClick={() => handleNavigation('home')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
              MedSage
            </span>
          </button>

          {/* Desktop nav + translator */}
          <div className="hidden md:flex items-center space-x-3">
            {/* navigation buttons */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => handleNavigation('privacy')}
                className="ml-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* TRANSLATOR: hidden widget + custom select */}
            {/* TranslateWidget must be present (kept hidden via CSS). CustomLangSelect shows the dropdown. */}
            <div className="flex items-center gap-2">
              <TranslateWidget />
              <div className="notranslate">
                <CustomLangSelect />
              </div>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            {/* Keep translator in mobile menu below (so we don't show it in header on tiny screens) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === item.id ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavigation('privacy')}
              className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Privacy
            </button>

            {/* TRANSLATOR in mobile menu */}
            <div className="mt-2 px-4">
              <div className="text-xs text-gray-500 mb-2">Language</div>
              <div className="notranslate">
                <TranslateWidget />
                <CustomLangSelect />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
