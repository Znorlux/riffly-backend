import { Injectable } from '@nestjs/common';
const Replicate = require('replicate'); // ✅ usa require en lugar de import

@Injectable()
export class RiffusionService {
  private replicate: any;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async generateTrack(body: any) {
    const {
      promptA,
      promptB = 'any complement for prompt A',
      alpha = 0.5,
      denoising = 0.75,
      seed_image_id = 'vibes',
      num_inference_steps = 50,
    } = body;

    const TIMEOUT = 1000 * 60 * 10;

    const generate = this.replicate.run(
      'riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05',
      {
        input: {
          prompt_a: promptA,
          prompt_b: promptB,
          alpha,
          denoising,
          seed_image_id,
          num_inference_steps,
        },
      },
    );

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout reached')), TIMEOUT),
    );

    const output = await Promise.race([generate, timeout]);

    return {
      riffusionResponse: output,
    };
  }

}
