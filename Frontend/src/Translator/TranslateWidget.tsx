// src/Translator/TranslateWidget.tsx
import React, { useEffect } from 'react';
import './google-translate.css';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const TranslateWidget: React.FC<{ included?: string }> = ({ included = 'en,hi,te,ta,kn,ml,bn,mr' }) => {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: included,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );
      }
    };

    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.body.appendChild(s);
    } else {
      if (window.googleTranslateElementInit) window.googleTranslateElementInit();
    }
  }, [included]);

  return <div id="google_translate_element" style={{ display: 'none' }} />;
};

export default TranslateWidget;
