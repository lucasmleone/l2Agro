'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()
    const telegramIdRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasCampos, setHasCampos] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            tg.setHeaderColor('#000000')
            tg.setBackgroundColor('#000000')

            const tgId = tg.initDataUnsafe?.user?.id || null
            if (tgId) {
                telegramIdRef.current = tgId
                checkCampos(tgId)
            } else {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const checkCampos = async (tgId: number) => {
        try {
            const response = await fetch('/api/telegram/campos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgId })
            })
            const data = await response.json()

            if (!response.ok && data.redirect) {
                router.push(data.redirect)
                return
            }

            setHasCampos(data.campos?.length > 0)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const ActionButton = ({ emoji, label, onClick, disabled }: { emoji: string; label: string; onClick: () => void; disabled?: boolean }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                aspectRatio: '1',
                borderRadius: '16px',
                background: disabled ? 'rgba(39, 39, 42, 0.4)' : 'rgba(39, 39, 42, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.6)',
                color: disabled ? '#52525b' : '#ffffff',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'transform 0.1s, background 0.2s'
            }}
        >
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
        </button>
    )

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#000000',
                color: '#a1a1aa'
            }}>
                Cargando...
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: '20px',
            backgroundColor: '#000000',
            color: '#ffffff',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '320px',
                marginBottom: '32px'
            }}>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    L2Agro
                </div>
                <button
                    onClick={() => router.push('/telegram/config')}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(39, 39, 42, 0.6)',
                        border: '1px solid rgba(63, 63, 70, 0.4)',
                        color: '#a1a1aa',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ⚙️
                </button>
            </div>

            {/* Grid de acciones */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '320px'
            }}>
                <ActionButton
                    emoji="🌧️"
                    label="Lluvia"
                    onClick={() => router.push('/telegram/registrar/lluvia')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    emoji="🌾"
                    label="Cosecha"
                    onClick={() => router.push('/telegram/registrar/cosecha')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    emoji="💉"
                    label="Aplicación"
                    onClick={() => router.push('/telegram/registrar/aplicacion')}
                    disabled={!hasCampos}
                />
                <ActionButton
                    emoji="🌱"
                    label="Siembra"
                    onClick={() => router.push('/telegram/registrar/siembra')}
                    disabled={!hasCampos}
                />
            </div>

            {/* Mensaje si no tiene campos */}
            {!hasCampos && (
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    textAlign: 'center',
                    maxWidth: '320px'
                }}>
                    <p style={{ fontSize: '13px', color: '#93c5fd', margin: 0 }}>
                        Agregá un campo en ⚙️ para empezar a registrar datos
                    </p>
                </div>
            )}
        </div>
    )
}
