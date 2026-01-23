// Archivo: types.d.ts
interface Window {
    Telegram: {
        WebApp: {
            ready: () => void;
            expand: () => void;
            close: () => void;
            initDataUnsafe: {
                user?: {
                    id: number;
                    first_name: string;
                    last_name?: string;
                    username?: string;
                };
            };
            // Agregamos esto para evitar errores con botones
            MainButton: {
                text: string;
                color: string;
                textColor: string;
                isVisible: boolean;
                isActive: boolean;
                show: () => void;
                hide: () => void;
                onClick: (callback: () => void) => void;
                offClick: (callback: () => void) => void;
                showProgress: (leaveActive: boolean) => void;
                hideProgress: () => void;
            };
        };
    };
}