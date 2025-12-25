'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export default function Home() {
    const [result, setResult] = useState(null);
    const [ready, setReady] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    const worker = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    // Initialize Worker
    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('./worker.js', import.meta.url), {
                type: 'module'
            });
        }

        const onMessageReceived = (e) => {
            switch (e.data.status) {
                case 'initiate':
                    setReady(false);
                    setStatus('Downloading model...');
                    break;
                case 'progress':
                    setReady(false);
                    setProgress(e.data.progress);
                    setStatus(`Loading model: ${Math.round(e.data.progress)}%`);
                    break;
                case 'done':
                    setReady(true);
                    setStatus('Model ready');
                    setProgress(0);
                    break;
                case 'complete':
                    setResult(e.data.result);
                    setStatus('Transcription complete');
                    break;
            }
        };

        worker.current.addEventListener('message', onMessageReceived);

        return () => worker.current.removeEventListener('message', onMessageReceived);
    }, []);

    const processAudio = (audioUrl) => {
        setStatus('Transcribing...');
        worker.current.postMessage({ audio: audioUrl });
    };

    // Handle File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Create an audio context to decode the audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result, (buffer) => {
                // We need to pass the float32 array to the worker? 
                // Actually transformers.js pipeline handles URLs or Float32Arrays.
                // Let's pass the URL if possible or just the raw buffer.
                // The worker expects data it can handle. Pipeline supports url or array.
                // Passing blob URL is easiest.
                processAudio(URL.createObjectURL(file));
            });
        }
        // Alternatively, just pass the URL object directly if supported
        // The pipeline supports URL string.
        processAudio(URL.createObjectURL(file));
    };


    // Handle Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                processAudio(audioUrl);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setStatus('Recording...');
        } catch (err) {
            console.error(err);
            setStatus('Error accessing microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            setStatus('Processing recording...');
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="glass-container w-full max-w-4xl flex flex-col items-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <h1 className="title">Whisper Scribe</h1>

                <p className="text-gray-300 mb-8 text-center max-w-lg">
                    Transform your speech into text instantly. Running 100% locally in your browser with AI.
                </p>

                {/* Status / Progress */}
                <div className="w-full mb-8 h-12 flex flex-col items-center justify-center">
                    {status && <div className="text-accent mb-2 font-mono text-sm">{status}</div>}
                    {(progress > 0 && progress < 100) && (
                        <div className="progress-bar w-64">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* Input Section */}
                    <div className="flex flex-col gap-6">
                        <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl hover:border-accent/50 transition-colors text-center cursor-pointer relative">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center">
                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                <span className="text-sm text-gray-300">Drop audio file or click to upload</span>
                                <span className="text-xs text-gray-500 mt-1">MP3, WAV, M4A supported</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="text-gray-500 text-sm">OR</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`btn-primary w-full flex items-center justify-center gap-3 py-4 ${isRecording ? 'bg-red-500 !important animate-pulse' : ''}`}
                            style={isRecording ? { background: '#ef4444', boxShadow: '0 0 20px #ef4444' } : {}}
                        >
                            {isRecording ? (
                                <>
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                    Stop Recording
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                    Start Recording
                                </>
                            )}
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="flex flex-col h-full min-h-[300px]">
                        <div className="glass-container flex-1 !p-4 !bg-black/20 !border-white/5 relative overflow-hidden group">
                            {result ? (
                                <div className="prose prose-invert max-w-none h-full overflow-y-auto whitespace-pre-wrap">
                                    {result}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 italic">
                                    Transcription will appear here...
                                </div>
                            )}

                            {result && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(result)}
                                    className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Copy to clipboard"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-xs text-gray-600">
                    Powered by OpenAI Whisper & Transformers.js
                </div>
            </div>
        </main>
    );
}
