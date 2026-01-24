'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' // Importamos tu cliente configurado
import { useRouter } from 'next/navigation' // Para movernos de página

export default function AuthPage() {
    const router = useRouter()

    // --- ESTADOS (La memoria temporal de la pantalla) ---
    const [loading, setLoading] = useState(false) // Para bloquear botones mientras procesa
    const [telegramId, setTelegramId] = useState<number | null>(null) // El ID que viene de Telegram
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('') // Mensajes para el usuario (Error/Éxito)

    // --- 1. DETECTAR ENTORNO TELEGRAM (Al cargar la página) ---
    useEffect(() => {
        console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        // 💡 Verificamos si existe el objeto 'Telegram' en la ventana del navegador.
        // Esto solo existe si la web se abre desde dentro de la App de Telegram.
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready() // Avisamos a Telegram que la app cargó


            // 💡 Intentamos leer el ID del usuario
            const userId = tg.initDataUnsafe?.user?.id

            if (userId) {
                setTelegramId(userId)

            } else {
                // Si estás probando en PC (fuera de Telegram), esto se ejecutará.
                // Puedes descomentar la línea de abajo para simular ser un usuario:
                // setTelegramId(999888777) 
                setStatus('⚠️ Advertencia: No se detectó usuario de Telegram real.')
            }
        }
    }, [])

    // --- 2. LÓGICA PRINCIPAL: LOGIN O REGISTRO ---
    const handleAuth = async (action: 'LOGIN' | 'REGISTER') => {
        // 💡 Validaciones de seguridad antes de enviar nada
        if (!telegramId) return setStatus('❌ Error crítico: No tengo tu ID de Telegram.')
        if (!email || !password) return setStatus('❌ Por favor completa email y contraseña.')

        setLoading(true)
        setStatus(action === 'LOGIN' ? 'Iniciando sesión...' : 'Creando usuario...')

        try {
            let userUuid = null // Aquí guardaremos el ID Real (Supabase UUID)

            // --- PASO A: Autenticación con Supabase Auth ---
            if (action === 'LOGIN') {
                // Intenta loguear. Si la contraseña está mal, Supabase lanza error aquí.
                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                userUuid = data.user.id
            } else {
                // Crea usuario nuevo. 
                // 💡 OJO: Si tienes "Confirm Email" activado en Supabase, esto podría pausarse aquí.
                // Para este MVP asumo que desactivaste la confirmación de email en Supabase Settings.
                const { data, error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                if (!data.user) throw new Error("No se pudo crear el usuario")
                userUuid = data.user.id
            }

            // --- PASO B: La Vinculación (El "Pegamento") ---
            setStatus('🔗 Vinculando tu Telegram con la cuenta...')

            // 💡 Usamos "upsert" (Update + Insert):
            // - Si este ID de Telegram NO existe en la tabla -> LO CREA.
            // - Si YA existe (ej: cambió de cuenta) -> ACTUALIZA el user_id.
            // Esto hace que el sistema sea robusto a cambios.
            const { error: linkError } = await supabase
                .from('telegram_connections')
                .upsert({
                    telegram_id: telegramId, // La clave única
                    user_id: userUuid,       // El usuario real que acabamos de loguear
                    // campo_id se deja null/vacío porque aún no elegimos campo
                }, { onConflict: 'telegram_id' })

            if (linkError) throw linkError

            // --- PASO C: Éxito y Redirección ---
            setStatus('✅ ¡Conectado! Entrando...')

            // Esperamos 1.5 seg para que el usuario lea el mensaje de éxito
            setTimeout(() => {
                router.push('/telegram/config') // Enviamos a la pantalla de crear/elegir campo
            }, 1500)

        } catch (error: any) {
            console.error(error)
            // Mostramos el error técnico de forma amigable (o cruda si es necesario)
            setStatus('❌ Error: ' + (error.message || "Fallo desconocido"))
        } finally {
            setLoading(false) // Desbloqueamos los botones
        }
    }

    // --- 3. LA INTERFAZ VISUAL (HTML/Tailwind) ---
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors">
            {/* Tarjeta con fondo secundario de Telegram */}
            <div
                className="w-full max-w-sm p-8 rounded-2xl shadow-xl border border-gray-800"
                style={{ backgroundColor: 'var(--tg-secondary-bg-color, #1c1c1e)' }}
            >

                <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--tg-text-color)' }}>
                    L2Agro 🚜
                </h1>
                <p className="text-sm text-center mb-8" style={{ color: 'var(--tg-hint-color)' }}>
                    Conecta tu cuenta para empezar.
                </p>

                {telegramId && (
                    <div className="mb-4 text-xs text-center py-1 px-3 rounded-full inline-block w-full bg-opacity-10 bg-white text-gray-300">
                        ID: {telegramId}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--tg-hint-color)' }}>Email</label>
                        <input
                            type="email"
                            className="w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={{
                                backgroundColor: 'var(--tg-bg-color, #000)',
                                color: 'var(--tg-text-color)',
                                borderColor: 'var(--tg-hint-color)'
                            }}
                            placeholder="usuario@campo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--tg-hint-color)' }}>Contraseña</label>
                        <input
                            type="password"
                            className="w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={{
                                backgroundColor: 'var(--tg-bg-color, #000)',
                                color: 'var(--tg-text-color)'
                            }}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <p className="text-center text-sm font-bold min-h-[24px] text-green-500 animate-pulse">
                        {status}
                    </p>

                    {/* Botón Principal con color nativo de Telegram */}
                    <button
                        onClick={() => handleAuth('LOGIN')}
                        disabled={loading}
                        className="w-full font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: 'var(--tg-button-color, #2481cc)',
                            color: 'var(--tg-button-text-color, #ffffff)'
                        }}
                    >
                        INGRESAR
                    </button>

                    <button
                        onClick={() => handleAuth('REGISTER')}
                        disabled={loading}
                        className="w-full font-bold py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50 border border-gray-600"
                        style={{ color: 'var(--tg-button-color, #2481cc)' }}
                    >
                        CREAR CUENTA
                    </button>
                </div>
            </div>
        </div>
    )
}