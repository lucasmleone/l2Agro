import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// ELIMINAMOS LAS FUENTES GEIST QUE SE VEN MAL EN MÓVIL
// Usaremos la fuente nativa del sistema automáticamente.

export const metadata: Metadata = {
  title: "L2Agro",
  description: "App de Campo",
};

// Configuración CRÍTICA para que no se vea "chico" en el celular
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      {/* "font-sans" aplica la fuente nativa de Apple/Android */}
      <body className="font-sans antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
