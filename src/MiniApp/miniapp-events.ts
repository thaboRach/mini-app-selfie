import objMiniApp, { MessageData } from "./MiniApp";

type ReadMessageData = {
  type: string;
  error?: string;
  errorMessage?: string;
  url?: string;
  data?: string;
  name?: string;
};

//MINI: Added MiniApp helper class
const attempt = <T>(func: () => T) => {
  try {
    return func();
  } catch (err) {
    console.error(err);
    // intentional swallowing of non functional error
  }
};

const MiniAppEvents = {
  sendMessage: (data: MessageData) => {
    attempt<void>(() => {
      objMiniApp.send(data);
    });
  },
  readMessage: (): ReadMessageData => {
    objMiniApp.send({
      messageType: "console",
      data: "before attempting read",
    });
    const message = attempt<ReadMessageData>(() => {
      return objMiniApp.read();
    });

    if (message) {
      return message;
    }

    throw new Error("No message");
  },
  listenForMessage: (
    func: (mutationRecords: MutationRecord[], observer: MutationObserver) => void,
  ) => {
    objMiniApp.send({
      messageType: "console",
      data: "before attempting listen for messages",
    });
    attempt(() => {
      objMiniApp.listenForMessage(func);
    });
  },
  toggleKeyboardOpenPadding: (open: boolean, elementID: string) => {
    attempt(() => {
      objMiniApp.toggleKeyboardOpenPadding(open, elementID);
    });
  },
  downloadBase64FileURL: (url: string) => {
    return attempt<Promise<string>>(() => {
      return objMiniApp.downloadBase64FileURL(url);
    })!;
  },
  isInMiniApp: () => {
    return sessionStorage.getItem("inMiniProgram") === "true";
  },
  isiOS: () => {
    return sessionStorage.getItem("platform") === "iOS";
  },
  isAndroid: () => {
    return sessionStorage.getItem("platform") === "Android";
  },
  hideLoading: () => {
    MiniAppEvents.sendMessage({
      messageType: "hide_loading",
    });
  },
};

export default MiniAppEvents;
