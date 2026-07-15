import { useContext } from 'react';
import { SadakaAuthContext } from '../contexts/SadakaAuthContext';

export const useSadakaAuth = () => {
  const context = useContext(SadakaAuthContext);
  if (!context) {
    throw new Error('useSadakaAuth must be used within SadakaAuthProvider');
  }

  return context;
};
