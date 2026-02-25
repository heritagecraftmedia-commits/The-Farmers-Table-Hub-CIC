import React, { createContext, useContext, useState, useEffect } from 'react';

interface FogContextType {
  isFogMode: boolean;
  toggleFogMode: () => void;
}

const FogContext = createContext<FogContextType | undefined>(undefined);

export const FogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFogMode, setIsFogMode] = useState(() => {
    const saved = localStorage.getItem('fogMode');
    return saved === 'true';
  });

  const toggleFogMode = () => {
    setIsFogMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('fogMode', String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    if (isFogMode) {
      document.body.classList.add('fog-mode-active');
    } else {
      document.body.classList.remove('fog-mode-active');
    }
  }, [isFogMode]);

  return (
    <FogContext.Provider value={{ isFogMode, toggleFogMode }}>
      {children}
    </FogContext.Provider>
  );
};

export const useFog = () => {
  const context = useContext(FogContext);
  if (context === undefined) {
    throw new Error('useFog must be used within a FogProvider');
  }
  return context;
};
