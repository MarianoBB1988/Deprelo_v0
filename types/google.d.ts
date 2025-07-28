// Declaraciones de tipos para Google Identity API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: {
              theme?: string;
              size?: string;
              width?: string;
              text?: string;
            }
          ) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export {};
