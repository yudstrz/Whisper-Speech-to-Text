import './globals.css'

export const metadata = {
    title: 'Whisper Scribe AI',
    description: 'Transform speech to text instantly with local AI.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased selection:bg-indigo-500/30 selection:text-white">
                {children}
            </body>
        </html>
    )
}
