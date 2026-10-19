import React, { createContext, useContext } from 'react';
import type { ResultMode } from '../types/navigation';

const PrototypeContext = createContext<{resultMode: ResultMode;}>({ resultMode: 'sample' });

export function PrototypeProvider({ resultMode, children }: {resultMode: ResultMode;children: React.ReactNode;}) {
  return <PrototypeContext.Provider value={{ resultMode }}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  return useContext(PrototypeContext);
}