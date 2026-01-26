// Archivo: types.d.ts
interface Window {
    Telegram: {
        WebApp: {
            ready: () => void;
            expand: () => void;
            close: () => void;
            // 👇 Agregamos estas definiciones nuevas
            setHeaderColor: (color: string) => void;
            setBackgroundColor: (color: string) => void;
            themeParams: {
                bg_color?: string;
                text_color?: string;
                hint_color?: string;
                link_color?: string;
                button_color?: string;
                button_text_color?: string;
                secondary_bg_color?: string;
            };
            // 👆 Fin de lo nuevo
            initDataUnsafe: {
                query_id?: string;
                user?: {
                    id: number;
                    first_name: string;
                    last_name?: string;
                    username?: string;
                    language_code?: string;
                };
                auth_date?: string;
                hash?: string;
                start_param?: string;
            };
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