
import { pipeline, env } from '@xenova/transformers';

// Skip local model checks
env.allowLocalModels = false;
env.useBrowserCache = false;

class PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'xenova/whisper-tiny';
    static quantized = true;
    static instance = null;

    static async getInstance(progress_callback = null, model = 'xenova/whisper-tiny') {
        if (this.instance === null || this.model !== model) {
            this.model = model;
            this.instance = await pipeline(this.task, this.model, {
                quantized: this.quantized,
                progress_callback,
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;

    // Initialize the pipeline
    let transcriber;
    try {
        transcriber = await PipelineFactory.getInstance(x => {
            self.postMessage(x);
        }, message.model);
    } catch (err) {
        console.error(err);
        self.postMessage({ status: 'error', data: err.message });
        return;
    }

    // If this is just a load command, stop here
    if (message.type === 'load') {
        self.postMessage({ status: 'done' });
        return;
    }

    // Otherwise, proceed with transcription
    let transcript = '';
    try {
        const output = await transcriber(message.audio, {
            top_k: 0,
            do_sample: false,
            return_timestamps: true,
            chunk_length_s: 30,
            stride_length_s: 5,
        });

        transcript = output.text;

    } catch (err) {
        console.error(err);
        transcript = 'Error: ' + err.message;
    }

    self.postMessage({
        status: 'complete',
        result: transcript,
    });
});
