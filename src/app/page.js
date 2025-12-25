'use client'

import { useState, useEffect, useRef } from 'react'

export default function Home() {
    const [result, setResult] = useState(null);
    // Remove ready state as it's implied by status
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const worker = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('./worker.js', import.meta.url), {
                type: 'module'
            });
        }

        const onMessageReceived = (e) => {
            switch (e.data.status) {
                case 'initiate':
                    setStatus('Downloading AI Model (First Run Only)...');
                    break;
                case 'progress':
                    setProgress(e.data.progress);
                    setStatus(`Downloading AI Model: ${Math.round(e.data.progress)}%`);
                    break;
                case 'done':
                    setStatus('Model Ready');
                    setProgress(0);
                    break;
                case 'complete':
                    setResult(e.data.result);
                    setStatus('Transcription Complete');
                    break;
            }
        };

        worker.current.addEventListener('message', onMessageReceived);

        // Trigger model loading immediately
        worker.current.postMessage({ type: 'load' });

        return () => worker.current?.removeEventListener('message', onMessageReceived);
    }, []);

    const processAudio = (audioUrl) => {
        setStatus('Transcribing audio...');
        worker.current.postMessage({ audio: audioUrl });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) processAudio(URL.createObjectURL(file));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                processAudio(URL.createObjectURL(audioBlob));
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setStatus('Listening...');
        } catch (err) {
            console.error(err);
            setStatus('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            setStatus('Processing audio...');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            processAudio(URL.createObjectURL(file));
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-5xl animate-fade-in z-10 flex flex-col gap-8">

                {/* Header */}
                <header className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        Whisper <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Scribe</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
                        Professional-grade speech transcription, running 100% locally in your browser.
                        <span className="block mt-2 text-xs uppercase tracking-widest text-slate-500 font-semibold">Privacy Focused • No Server Uploads</span>
                    </p>
                </header>

                {/* Progress Indicator */}
                {(status || progress > 0) && (
                    <div className="w-full max-w-md mx-auto mb-4">
                        <div className="flex justify-between text-xs uppercase tracking-wider text-indigo-300 mb-2 font-medium">
                            <span>{status}</span>
                            <span>{progress > 0 && progress < 100 ? `${Math.round(progress)}%` : ''}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: progress > 0 ? `${progress}%` : (status ? '100%' : '0%'), opacity: status && !progress ? 0.3 : 1 }}
                            />
                        </div>
                    </div>
                )}

                {/* Main Control Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[500px]">

                    {/* Left: Input Actions */}
                    <div className="flex flex-col gap-6">

                        {/* Upload Zone */}
                        <div
                            className={`glass-panel p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer relative group flex flex-col items-center justify-center flex-1 min-h-[250px]
                                ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                            `}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />

                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2">Drop Audio File</h3>
                            <p className="text-slate-400 text-sm text-center">or click to browse (MP3, WAV, M4A)</p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 text-slate-600 text-sm font-medium uppercase tracking-widest">
                            <div className="h-px bg-white/10 flex-1"></div>
                            OR
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        {/* Record Button */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`
                                group relative w-full p-6 rounded-3xl flex items-center justify-center gap-4 transition-all duration-300
                                ${isRecording ? 'bg-red-500/10 border border-red-500/50' : 'glass-panel hover:bg-white/10'}
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                                ${isRecording ? 'bg-red-500 animate-pulse shadow-red-500/50' : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/50 group-hover:scale-110'}
                            `}>
                                {isRecording ? (
                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                )}
                            </div>
                            <span className={`text-lg font-semibold ${isRecording ? 'text-red-400' : 'text-white'}`}>
                                {isRecording ? 'Stop Recording' : 'Start Microphone'}
                            </span>
                        </button>
                    </div>

                    {/* Right: Output Section */}
                    <div className="glass-card flex flex-col relative overflow-hidden h-[600px] lg:h-auto">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>

                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                Transcript
                            </h2>
                            {result && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(result)}
                                    className="text-xs font-medium text-indigo-300 hover:text-white transition-colors duration-200 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                                    Copy Text
                                </button>
                            )}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-light leading-relaxed text-slate-200 whitespace-pre-wrap">
                            {result || (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                    <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                    <p>Ready to transcribe...</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <footer className="text-center pb-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-xs text-white">Powered by OpenAI Whisper & Xenova Transformers.js</p>
                </footer>

            </div>
        </main>
    );
}
