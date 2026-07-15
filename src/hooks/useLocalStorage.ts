export const useSessionStorage = <T,>(key: string) => {
  const getItem = (): T | null => {
    const value = window.sessionStorage.getItem(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const setItem = (value: T): void => {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  };

  const removeItem = (): void => {
    window.sessionStorage.removeItem(key);
  };

  return { getItem, setItem, removeItem };
};
