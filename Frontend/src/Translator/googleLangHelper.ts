// src/Translator/googleLangHelper.ts
const COOKIE_NAME = 'googtrans';

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; domain=.${location.hostname}; path=/; expires=${expires}`;
  } catch (e) {}
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  try {
    document.cookie = `${name}=; domain=.${location.hostname}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (e) {}
}

function trySetComboLanguage(langCode: string): boolean {
  try {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (!combo) return false;
    combo.value = langCode;
    combo.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    combo.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    return true;
  } catch (e) {
    return false;
  }
}

export function setGoogleTranslateLang(langCode: string) {
  if (!langCode || langCode === 'original') {
    deleteCookie(COOKIE_NAME);
    if (trySetComboLanguage('en')) return;
    setTimeout(() => window.location.reload(), 60);
    return;
  }

  if (trySetComboLanguage(langCode)) {
    setCookie(COOKIE_NAME, `/auto/${langCode}`);
    return;
  }

  setCookie(COOKIE_NAME, `/auto/${langCode}`);
  setTimeout(() => window.location.reload(), 60);
}

export function getGoogleTranslateLang(): string {
  const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (!m) return 'original';
  try {
    const val = decodeURIComponent(m[1]);
    const parts = val.split('/');
    const code = parts[parts.length - 1] || 'original';
    if (!code || code === 'auto') return 'original';
    return code;
  } catch {
    return 'original';
  }
}
