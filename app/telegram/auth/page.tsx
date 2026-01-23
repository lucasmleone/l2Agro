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
            tg.expand() // Pedimos que ocupe toda la altura del celular

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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 font-sans text-gray-800">
            <div className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-xl border border-gray-100">

                <h1 className="text-2xl font-bold text-center mb-2 text-green-700">L2Agro 🚜</h1>
                <p className="text-sm text-center text-gray-500 mb-8">
                    Conecta tu cuenta para empezar a gestionar.
                </p>

                {/* 💡 Debug Visual: Muestra el ID de Telegram si se detectó */}
                {telegramId && (
                    <div className="mb-4 text-xs text-center bg-green-50 text-green-700 py-1 px-3 rounded-full inline-block w-full">
                        Telegram ID Detectado: {telegramId}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="usuario@campo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Área de Mensajes de Estado (Carga, Error, Éxito) */}
                    <p className="text-center text-sm font-bold min-h-[24px] text-green-600 animate-pulse">
                        {status}
                    </p>

                    {/* Botones de Acción */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleAuth('LOGIN')}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
                        >
                            INGRESAR
                        </button>

                        <button
                            onClick={() => handleAuth('REGISTER')}
                            disabled={loading}
                            className="w-full bg-white text-green-700 border-2 border-green-600 font-bold py-3 rounded-xl hover:bg-green-50 active:scale-95 transition-all disabled:opacity-50"
                        >
                            CREAR CUENTA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}