import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }
      console.log({ prediction });
      setPrediction(prediction);
    }
  };

  let patches = new Array(10);

  for (let i = 0; i < 10; i++) {
    patches[i] = new Array(10).fill(null);
  }

  patches[0][0] =
    "https://replicate.delivery/pbxt/E6Ftpfi0dF1SOi4b6ltUwsfdxUf7zTQSfdhmJfRcfGTdZ88UE/out-0.png";

  return (
    <div className="">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <div
        className="grid"
        style={{
          gridTemplateRows: "repeat(10, minmax(0, 1fr))",
          gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
        }}
      >
        {patches.map((row, i) =>
          row.map((patch, j) => {
            return patch ? (
              <img src={patch} className="" alt="" />
            ) : (
              <div className="border-right border-r border-b border-slate-200"></div>
            );
          })
        )}
      </div>

      <form
        className="absolute bottom-0 w-full p-4 flex bg-slate-100"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt to add a patch"
        />
        <button className="button" type="submit">
          Go!
        </button>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper mt-5">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                sizes="100vw"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>
        </>
      )}
    </div>
  );
}
