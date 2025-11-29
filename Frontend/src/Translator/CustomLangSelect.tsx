// src/Translator/CustomLangSelect.tsx
import React, { useEffect, useState } from 'react';
import { setGoogleTranslateLang, getGoogleTranslateLang } from './googleLangHelper';
import './google-translate.css';

type Lang = { code: string; label: string; flag: string };

const LANGS: Lang[] = [
  { code: 'original', label: 'Original', flag: '🏳️' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];

const CustomLangSelect: React.FC<{ ariaLabel?: string }> = ({ ariaLabel = 'Select language' }) => {
  const [selected, setSelected] = useState<string>('original');

  useEffect(() => {
    const cur = getGoogleTranslateLang();
    setSelected(cur || 'original');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelected(lang);
    setGoogleTranslateLang(lang);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="lang-select notranslate"
      translate="no"
      aria-label={ariaLabel}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} translate="no" className="notranslate">
          {`${l.flag} ${l.label}`}
        </option>
      ))}
    </select>
  );
};

export default CustomLangSelect;
