import './globals.css'

export const metadata = {
    title: 'Whisper Scribe',
    description: 'AI-powered speech to text directly in your browser.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body>{children}</body>
        </html>
    )
}
