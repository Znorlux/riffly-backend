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

  async generateTrack(body: any) {
    const {
      promptA = 'funky synth solo',
      promptB = '90s rap',
      alpha = 0.5,
      denoising = 0.75,
      seed_image_id = 'vibes',
      num_inference_steps = 50,
    } = body;

    const modelUrl =
      'riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05';

    const input = {
      prompt_a: promptA,
      prompt_b: promptB,
      alpha,
      denoising,
      seed_image_id,
      num_inference_steps,
    };

    const prediction = await this.replicate.predictions.create({
      version: modelUrl,
      input,
      wait: true,
    });
    return prediction;
  }
}
