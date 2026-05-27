import { useState } from 'react';

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return { isDark, toggle };
}

export default useDarkMode;
