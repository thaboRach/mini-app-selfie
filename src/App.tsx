import { Button } from "@vfs-digital-channels/ns-react-components";
import { useMemo, useState } from "react";
import MiniAppEvents from "./MiniApp/miniapp-events";
import { getFileType } from "./utils";
import { FileUpload } from "./FileUpload";

function App() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const inMiniApp = useMemo((): boolean => MiniAppEvents.isInMiniApp(), []);

  const resizeDataURL = (
    data: string,
    preserveWidth: boolean,
    scalingFactor: number,
  ) => {
    const height = 480;
    const width = 640;
    // We create an image to receive the Data URI
    const img = document.createElement("img");

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
      // check scale
      const scale = preserveWidth
        ? (width / img.width) * scalingFactor
        : (height / img.height) * scalingFactor;

      // We create a canvas and get its context.
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.scale(scale, scale);

      const xPos = ((canvas.width - img.width * scale) * 0.5) / scale;
      const yPos = ((canvas.height - img.height * scale) * 0.5) / scale;

      // Center the image within canvas bounds (crop to center)
      ctx.drawImage(img, xPos, yPos);

      //Convert canvas image to JPEG
      const dataURI = canvas.toDataURL("image/jpeg");
      setImgSrc(dataURI);
    };

    // We put the Data URI in the image's src attribute (done after onload is declared to ensure it is defined on-load)
    const fileType = getFileType(data);
    img.src = `data:${fileType.mime};base64,${data}`;
  };

  const onOpenCamera = () => {
    console.log("Open Camera");

    if (inMiniApp) {
      //Tell mini app we want to take a selfie
      MiniAppEvents.sendMessage({
        messageType: "selfie",
      });

      MiniAppEvents.listenForMessage((_mutationRecords, observer) => {
        const message = MiniAppEvents.readMessage();
        if (message.type === "selfie") {
          observer.disconnect();
          if (message.error) {
            //If error occurs while trying to upload file on mini-app side

            console.error(message.errorMessage);
          } else if (message.url) {
            //If message returned is selfie message, then set imgSrc
            MiniAppEvents.downloadBase64FileURL(message.url)
              .then((res) => {
                resizeDataURL(res, false, 1.2);
              })
              .catch((error) => {
                //If error occurs while trying to download file on portal side
                console.error(error, true, true);
              });
          }
        }
      });

      return;
    }

    MiniAppEvents.sendMessage({
      messageType: "console",
      data: "Normal Camera",
    });
  };

  return (
    <main className="flex flex-col items-center w-full min-h-screen gap-8 p-8 text-white bg-gray-800">
      <h1 className="text-4xl">Selfie Screen</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Please click the button below to take a selfie</h2>
        <Button size="md" onClick={onOpenCamera}>
          Open Camera
        </Button>

        {imgSrc && <img className="" src={imgSrc} />}
      </section>

      <section className="w-full">
        <FileUpload />
      </section>

      {/* testing */}
      {/* <input
        id="messageReceiveListener"
        className="h-10 text-black outline-none w-80"
      ></input> */}
    </main>
  );
}

export default App;
