import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import MiniAppEvents from "./MiniApp/miniapp-events";
// import { useEventEmitter } from "ahooks";

enum FileTypes {
  jpeg = "image/jpeg",
  png = "image/png",
  pdf = "application/pdf",
}

type FileType = {
  ext?: string;
  mime: FileTypes;
};

export const FileUpload = () => {
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  // const [dummyCounter, setDummyCounter] = useState<number>(0);

  // const eventEmitter = useEventEmitter();

  const inMiniApp = useMemo((): boolean => MiniAppEvents.isInMiniApp(), []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = currentFiles;
      acceptedFiles.forEach((file: File) => {
        console.log(file);
        f.push(file);
      });

      setCurrentFiles(f);
    },
    [currentFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const getFileType = (base64: string): FileType => {
    //Get messageType
    let fileType: FileType = { mime: FileTypes.jpeg };
    //check for JPEG ['application/pdf', 'image/jpeg']
    const regex = new RegExp("(?=^(?:.{4})*$)^JVBER[a-zA-Z0-9+/]*={0,3}$");
    if (base64.charAt(0) === "/") {
      fileType = { ext: ".jpg", mime: FileTypes.jpeg };
    } else if (regex.test(base64)) {
      //Check for pdf
      fileType = { ext: ".pdf", mime: FileTypes.pdf };
    }
    return fileType;
  };

  const base64ToFile = (base64: string, filename: string, mime: FileTypes): File => {
    const base64String = atob(base64);
    let base64StrLength = base64String.length;
    const u8Array = new Uint8Array(base64StrLength);

    while (base64StrLength--) {
      u8Array[base64StrLength] = base64String.charCodeAt(base64StrLength);
    }

    return new File([u8Array], filename, { type: mime });
  };

  const miniappOnClick = () => {
    const newFiles = currentFiles;

    inMiniApp &&
      MiniAppEvents.sendMessage({
        messageType: "console",
        data: "miniapp onClick",
      });

    MiniAppEvents.sendMessage({
      messageType: "ID",
      maxSize: 10_485_760, // 10mb
    });

    MiniAppEvents.listenForMessage(
      (mutationRecords: MutationRecord[], observer: MutationObserver) => {
        if (mutationRecords.length) {
          MiniAppEvents.sendMessage({
            messageType: "console",
            data: "Something has changed",
          });
        }

        const message = MiniAppEvents.readMessage();
        // const message = { url: undefined, error: undefined, name: undefined };

        inMiniApp &&
          MiniAppEvents.sendMessage({
            messageType: "console",
            data: JSON.stringify({
              message: "message",
              data: message,
            }),
          });

        if (message.url) {
          MiniAppEvents.downloadBase64FileURL(message.url)
            .then((res) => {
              inMiniApp &&
                MiniAppEvents.sendMessage({
                  messageType: "console",
                  data: JSON.stringify({
                    message: "downloadBase64FileURL response",
                    data: res,
                  }),
                });

              const base64Data = res;

              const fileType = getFileType(base64Data);

              const messageNameAndType =
                (message?.name ?? "").split(".")[0] + fileType.ext;
              const file = base64ToFile(
                base64Data,
                messageNameAndType,
                fileType.mime,
              );

              newFiles.push(file);
              // emit event
              // eventEmitter.emit(setCurrentFiles(newFiles));
              setCurrentFiles(newFiles);
              // setDummyCounter(currentFiles.length);

              inMiniApp &&
                MiniAppEvents.sendMessage({
                  messageType: "console",
                  data: JSON.stringify({
                    message: "file",
                    data: file,
                    file: {
                      name: messageNameAndType,
                      fileType: fileType,
                      base64Data: base64Data,
                    },
                  }),
                });

              inMiniApp &&
                MiniAppEvents.sendMessage({
                  messageType: "console",
                  data: JSON.stringify({
                    message: "newFiles",
                    current: currentFiles,
                    new: newFiles,
                    extra: {
                      name: file.name,
                      type: file.type,
                    },
                  }),
                });
            })
            .catch((error) => {
              inMiniApp &&
                MiniAppEvents.sendMessage({
                  messageType: "console",
                  data: JSON.stringify({
                    message: "catch block - error",
                    data: error,
                  }),
                });
            });

          observer.disconnect();
        }

        if (message.error) {
          // log the error
          inMiniApp &&
            MiniAppEvents.sendMessage({
              messageType: "console",
              data: JSON.stringify({
                message: "error uploading file",
                data: message.error,
              }),
            });
        }

        MiniAppEvents.sendMessage({
          messageType: "console",
          data: "end of listening",
        });
      },
    );
  };

  useEffect(() => {
    inMiniApp &&
      MiniAppEvents.sendMessage({
        messageType: "console",
        data: JSON.stringify({
          message: "There was a change in current files",
          data: currentFiles.map((file: File) => file.name),
        }),
      });
  }, [currentFiles, inMiniApp]);

  // useEffect(() => {
  //   inMiniApp &&
  //     MiniAppEvents.sendMessage({
  //       messageType: "console",
  //       data: "dummyCounter has changed",
  //     });
  // }, [inMiniApp, dummyCounter]);

  return (
    <section className="flex flex-col items-center w-full gap-8 mt-10">
      <h3 className="text-3xl">Upload file</h3>
      <div
        {...getRootProps()}
        // comment the onclick to test on the browser
        onClick={(event) => {
          event.stopPropagation();
          miniappOnClick();
        }}
        className="gap-4 px-4 py-2 text-black bg-white outline-none cursor-pointer min-w-6/12 max-w-10/12 text-wrap min-h-40 rounded-2xl"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="mb-2">Drop the files here ...</p>
        ) : (
          <p className="mb-2">
            Drag 'n' drop some files here, or click to select files
          </p>
        )}

        {!!currentFiles.length &&
          currentFiles.map((file, index) => (
            <>
              <div className="w-full h-0.5 bg-gray-500/50" />
              <p key={index} className="text-sm">{`${index + 1} - ${file.name}`}</p>
            </>
          ))}
      </div>

      <div className="flex gap-8 text-3xl text-white">
        {/* <button
          type="button"
          className=""
          onClick={() => {
            setdummyCounter(dummyCounter - 1);
          }}
        >
          -
        </button> */}
        {/* <p className="hidden">{dummyCounter}</p> */}
        {/* <button
          type="button"
          className=""
          onClick={() => {
            setdummyCounter(dummyCounter + 1);
          }}
        >
          +
        </button> */}
      </div>
    </section>
  );
};
