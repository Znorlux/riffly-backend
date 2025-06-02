import { Injectable } from '@nestjs/common';
const Replicate = require('replicate');

@Injectable()
export class RiffusionService {
  private replicate: any;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  /**
   * Polls the Replicate API until the prediction reaches a terminal state.
   * Waits up to 60 retries (2 seconds per retry = ~2 minutes max).
   *
   * @param predictionId - The ID of the prediction to monitor
   * @returns The final prediction object
   * @throws Error if the prediction does not complete within the allowed time
   */
  private async waitForPrediction(predictionId: string): Promise<any> {
    let prediction;
    const maxRetries = 60;
    let retries = 0;

    while (retries < maxRetries) {
      prediction = await this.replicate.predictions.get(predictionId);

      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        return prediction;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries++;
    }

    throw new Error('Prediction timed out');
  }

  /**
   * Generates a music track using the MiniMax model from Replicate.
   * If no custom lyrics are provided, a default AI-themed song is used.
   *
   * @param body - An object containing optional `promptA` (lyrics) and `promptB` (instrumental URL)
   * @returns The final prediction result from Replicate
   */
  async generateTrack(body: any): Promise<any> {
    const {
      promptA = `[intro]

No lyrics? No problem, I'm ready to shine  
MiniMax in the lab, cookin’ audio so fine  
Default track, but still got that flame  
AI on the beat, remember the name  

[chorus]  
Riffusion in the wires, feel the groove ignite  
Even my fallback track hits just right`,
      promptB = "https://replicate.delivery/pbxt/M9zum1Y6qujy02jeigHTJzn0lBTQOemB7OkH5XmmPSC5OUoO/MiniMax-Electronic.wav",
    } = body;

    const modelUrl = 'minimax/music-01';

    const input = {
      lyrics: promptA,
      song_file: promptB,
    };

    const initialPrediction = await this.replicate.predictions.create({
      version: modelUrl,
      input,
    });

    const finalPrediction = await this.waitForPrediction(initialPrediction.id);

    return finalPrediction;
  }
}
