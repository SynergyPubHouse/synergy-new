import { useEffect } from 'react';

export function useAutoLogout(logout) {
  const AUTO_LOGOUT_TIME = 5 * 60 * 60 * 1000; 

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return;
    }

    const loginTime = user.loginTime || Date.now();
    const elapsed = Date.now() - loginTime;
    const remaining = AUTO_LOGOUT_TIME - elapsed;

    if (remaining <= 0) {
      handleAutoLogout();
      return;
    }

    const logoutTimeout = setTimeout(() => {
      handleAutoLogout();
    }, remaining);

    return () => {
      clearTimeout(logoutTimeout);
    };
  }, [logout]);

  const handleAutoLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    if (logout) {
      logout();
    }
    
    alert('⏰ Your session has expired after 5 hours. Please login again.');
    window.location.href = '/login';
  };
}