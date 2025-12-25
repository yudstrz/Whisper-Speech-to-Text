
import { pipeline, env } from '@xenova/transformers';

// Skip local model checks
env.allowLocalModels = false;
env.useBrowserCache = false;

class PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'xenova/whisper-tiny';
    static quantized = true;
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
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

    // Do some work...
    // TODO: Add support for other tasks?
    let transcript = '';
    try {
        const transcriber = await PipelineFactory.getInstance(x => {
            // We also report progress to the main thread
            self.postMessage(x);
        });

        const output = await transcriber(message.audio, {
            // Greedy
            top_k: 0,
            do_sample: false,

            // Spanish to English?
            // language: 'spanish', task: 'translate',

            // Return timestamps
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
