import Replicate from "replicate";
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
const maskSize = 256;
const version =
  "c11bac58203367db93a3c552bd49a25a5418458ddffb7e90dae55780765e26d6";

export default async function handler(req, res) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  const { prompt, neighborTop, neighborLeft } = req.body;
  if (!neighborTop && !neighborLeft) {
    const prediction = await replicate.predictions.create({
      version:
        "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
      input: {
        prompt: prompt,
        width: 768,
        height: 768,
      },
    });
    res.statusCode = 201;
    res.end(JSON.stringify(prediction));
  }

  const { image, mask, width, height } = await generateImageAndMask(
    neighborTop,
    neighborLeft
  );

  const prediction = await replicate.predictions.create({
    version: version,
    input: {
      prompt: prompt,
      width: width,
      height: height,
      image: image,
      mask: mask,
    },
  });
  res.statusCode = 201;
  res.end(JSON.stringify(prediction));
}

async function fetchImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return loadImage(Buffer.from(response.data));
}

async function generateImageAndMask(topUrl, leftUrl) {
  let canvasWidth = 768 + maskSize;
  let canvasHeight = 768 + maskSize;
  if (!topUrl) {
    canvasHeight = 768;
  }
  if (!leftUrl) {
    canvasWidth = 768;
  }

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  const maskCanvas = createCanvas(canvasWidth, canvasHeight);
  const maskCtx = maskCanvas.getContext("2d");

  // Initialize with white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  maskCtx.fillStyle = "white";
  maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (topUrl && leftUrl) {
    const topImage = await fetchImage(topUrl);
    ctx.drawImage(
      topImage,
      0,
      topImage.height - maskSize,
      768,
      maskSize,
      maskSize,
      0,
      768,
      maskSize
    );
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(maskSize, 0, 768, maskSize);

    const leftImage = await fetchImage(leftUrl);
    ctx.drawImage(
      leftImage,
      leftImage.width - maskSize,
      0,
      maskSize,
      768,
      0,
      maskSize,
      maskSize,
      768
    );
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, maskSize, maskSize, 768);
  } else if (topUrl) {
    const topImage = await fetchImage(topUrl);
    ctx.drawImage(
      topImage,
      0,
      topImage.height - maskSize,
      768,
      maskSize,
      0,
      0,
      768,
      maskSize
    );
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, 768, maskSize);
  } else if (leftUrl) {
    const leftImage = await fetchImage(leftUrl);
    ctx.drawImage(
      leftImage,
      leftImage.width - maskSize,
      0,
      maskSize,
      768,
      0,
      0,
      maskSize,
      768
    );
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskSize, 768);
  }

  /*
  const imageBuffer = canvas.toBuffer('image/png');
  const maskBuffer = maskCanvas.toBuffer('image/png');
  fs.writeFileSync('./image.png', imageBuffer);
  fs.writeFileSync('./mask.png', maskBuffer);
  */

  const imageDataUrl = canvas.toDataURL("image/png");
  const maskDataUrl = maskCanvas.toDataURL("image/png");

  return {
    image: imageDataUrl,
    mask: maskDataUrl,
    width: canvasWidth,
    height: canvasHeight,
  };
}
