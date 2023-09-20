import Replicate from "replicate";
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  const prediction = await replicate.predictions.get(req.query.id);

  if (prediction?.error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: prediction.error }));
    return;
  }

  if (prediction.status == "succeeded") {
    res.end(JSON.stringify({
      output: await cropBottomRight(prediction.output[0]),
      status: prediction.status,
    }));
  } else {
    res.end(JSON.stringify(prediction));
  }
}

async function cropBottomRight(imageUrl) {
  // Load the image
  const img = await loadImage(imageUrl);

  // Create a canvas with 768x768 dimensions
  const canvas = createCanvas(768, 768);
  const ctx = canvas.getContext('2d');

  // Calculate the x, y coordinates for cropping the bottom right portion
  const x = img.width - 768;
  const y = img.height - 768;

  // Draw the image onto the canvas starting at the calculated coordinates
  ctx.drawImage(img, x, y, 768, 768, 0, 0, 768, 768);

  // Convert to PNG data URL or any other format you need
  const croppedDataUrl = canvas.toDataURL('image/png');

  return croppedDataUrl;
}
