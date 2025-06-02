import { Injectable } from '@nestjs/common';
import { CreateMinimaxDto } from './dto/create-minimax.dto';
import { MinimaxPrediction } from './interfaces/minimax-prediction.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Replicate = require('replicate');

@Injectable()
export class MinimaxService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private replicate: any;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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
  private async waitForPrediction(
    predictionId: string,
  ): Promise<MinimaxPrediction> {
    let prediction: MinimaxPrediction;
    const maxRetries = 60;
    let retries = 0;

    while (retries < maxRetries) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      prediction = await this.replicate.predictions.get(predictionId);

      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        return prediction;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries++;
    }

    throw new Error('Prediction timed out after 2 minutes');
  }

  /**
   * Generates a music track using the MiniMax model from Replicate.
   * Creates a song inspired by an existing track with custom or default lyrics.
   *
   * @param createMinimaxDto - DTO containing lyrics and reference audio URL
   * @returns The final prediction result from Replicate
   */
  async generateTrack(
    createMinimaxDto: CreateMinimaxDto,
  ): Promise<MinimaxPrediction> {
    const {
      promptA = `[intro]

No lyrics? No problem, I'm ready to shine  
MiniMax in the lab, cookin' audio so fine  
Default track, but still got that flame  
AI on the beat, remember the name  

[chorus]  
Riffusion in the wires, feel the groove ignite  
Even my fallback track hits just right`,
      promptB = 'https://replicate.delivery/pbxt/M9zum1Y6qujy02jeigHTJzn0lBTQOemB7OkH5XmmPSC5OUoO/MiniMax-Electronic.wav',
    } = createMinimaxDto;

    const modelUrl = 'minimax/music-01';

    const input = {
      lyrics: promptA,
      song_file: promptB,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const initialPrediction = await this.replicate.predictions.create({
        version: modelUrl,
        input,
      });

      const finalPrediction = await this.waitForPrediction(
        initialPrediction.id,
      );

      if (finalPrediction.status === 'failed') {
        throw new Error(
          `MiniMax generation failed: ${finalPrediction.error || 'Unknown error'}`,
        );
      }

      return finalPrediction;
    } catch (error) {
      console.error('Error generating track with MiniMax:', error);
      throw new Error(
        `Failed to generate track: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
