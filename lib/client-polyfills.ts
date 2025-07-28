// Polyfill para evitar errores de módulos Node.js en el cliente
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  
  // Mock de módulos Node.js para el cliente
  const mockModule = {};
  
  // @ts-ignore
  window.require = (module) => {
    if (module === 'fs' || module === 'path' || module === 'os' || module === 'crypto') {
      return mockModule;
    }
    throw new Error(`Module ${module} not found`);
  };
}

export {};
