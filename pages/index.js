import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Spinner from "../components/spinner";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let initialPatches = new Array(10);
for (let i = 0; i < 10; i++) {
  initialPatches[i] = new Array(10).fill(null);
}

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const [patches, setPatches] = useState(initialPatches);

  const [currentPatch, setCurrentPatch] = useState(null);

  const setPatch = ([x, y], url) => {
    setPatches(
      patches.map((row, i) =>
        row.map((patch, j) => {
          if (i === x && j === y) {
            return url;
          } else {
            return patch;
          }
        })
      )
    );
  };

  const setNextPatch = (url) => {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; i++) {
        if (patches[i][j] === null) {
          setPatch(i, j, url);
          return;
        }
      }
    }
  };

  const pickNextPatch = () => {
    let possibleCoordinates = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        // If it's at the top or the left or it has top and left neighbors
        if (
          patches[i][j] === null &&
          ((patches[i - 1] && patches[i - 1][j] && j === 0) ||
            (i === 0 && patches[i][j - 1]) ||
            (patches[i - 1] && patches[i - 1][j] && patches[i][j - 1]))
        ) {
          possibleCoordinates.push([i, j]);
        }
      }
    }

    if (possibleCoordinates.length === 0) {
      return [0, 0];
    }

    // Randomly select an item from possibleCoordinates
    return possibleCoordinates[
      Math.floor(Math.random() * possibleCoordinates.length)
    ];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let currentPatch = pickNextPatch();
    setCurrentPatch(currentPatch);
    console.log("currentPatch", currentPatch);

    // setPatch(
    //   [3, 7],
    //   "https://replicate.delivery/pbxt/E6Ftpfi0dF1SOi4b6ltUwsfdxUf7zTQSfdhmJfRcfGTdZ88UE/out-0.png"
    // );

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
        neighborTop:
          patches[currentPatch[0] - 1] &&
          patches[currentPatch[0] - 1][currentPatch[1]],
        neighborLeft: patches[currentPatch[0]][currentPatch[1] - 1],
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
      await sleep(250);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        setPrediction(null);
        return;
      }

      console.log({ prediction });
    }
    setPatch(currentPatch, prediction.output);
    setPrediction(null);
  };

  return (
    <div className="">
      <Head>
        <title>Patchwork</title>
      </Head>

      <div
        className="grid"
        style={{
          gridTemplateRows: "repeat(10, 1fr)",
          gridTemplateColumns: "repeat(10, 1fr)",
        }}
      >
        {patches.map((row, i) =>
          row.map((patch, j) => {
            return patch ? (
              <img key={i + j} src={patch} className="aspect-square" alt="" />
            ) : (
              <div
                key={i + j}
                className="border-right border-r border-b border-slate-200 aspect-square "
              >
                {currentPatch &&
                  i === currentPatch[0] &&
                  j === currentPatch[1] && (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-16 h-16">
                        <Spinner />
                      </div>
                    </div>
                  )}
              </div>
            );
          })
        )}
      </div>

      <form
        className="fixed bottom-0 w-full p-4 flex bg-slate-100"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt to add a patch"
        />
        <button
          className="button"
          type="submit"
          disabled={prediction ? true : false}
        >
          {prediction ? prediction.status : "Go!"}
        </button>
        {error && <div>{error}</div>}
      </form>
    </div>
  );
}
