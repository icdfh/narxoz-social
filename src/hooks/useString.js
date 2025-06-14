// src/hooks/useString.js
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { strings } from '../i18n/strings';

export function useString(key) {
  const { lang } = useContext(LanguageContext);
  return strings[lang][key] || key;
}
