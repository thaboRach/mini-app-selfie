import MiniAppEvents from "./miniapp-events";
// https://developer.vodapay.vodacom.co.za/docs/miniprogram_vodacom/mpdev/component_open_web-view

export type MessageData = {
  messageType: "selfie" | "console" | "hide_loading" | "ID";
  data?: string;
  maxSize?: number;
};

declare global {
  interface Window {
    sendMessage: (data: MessageData) => void;
    // chooseImage: any;
  }
}

//MINI: Class for interfacing with MiniApp functionality
class MiniApp {
  _queue: { (): void }[] = [];
  _initialized: boolean = false;
  _frequency: number = 100;
  _timeout: number = 2000 * this._frequency; // 2 seconds * frequency (milliseconds);
  _currentTimeout: number | undefined = undefined;

  constructor() {
    this._run();
  }

  _run() {
    window.setTimeout(() => {
      if ("my" in window) {
        this._initialized = true;
        this._timeout = 0;

        this._process();
      }

      this._timeout -= this._frequency;

      if (this._timeout > 0) {
        this._run();
      }
    }, this._frequency);
  }

  // Process queue
  _process() {
    if (!this._initialized) {
      return;
    }

    let action;

    action = this._queue.shift();

    while (action) {
      action();
      action = this._queue.shift();
    }
  }

  listenForMessage(func: (observer: MutationObserver) => void) {
    this.send({
      messageType: "console",
      data: "logging: observing",
    });

    //MINI: Listen for change to imageURL element to determine when message is received
    const targetNode = document.getElementById("messageReceiveListener")!;
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    };
    const observer = new MutationObserver(function () {
      func(observer);
    });
    observer.observe(targetNode, config);
  }

  //MINI: Send message to Mini App
  send(data: MessageData) {
    this._queue.push(() => {
      window.sendMessage(data);
    });
    this._process();
  }

  //MINI: Read message from session storage
  read() {
    try {
      const message = sessionStorage.getItem("message");
      return message ? JSON.parse(message) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  toggleKeyboardOpenPadding(open: boolean, elementID: string) {
    const element = document.getElementById(elementID);
    if (element) {
      if (open) {
        clearTimeout(this._currentTimeout);
        element.classList.add("keyboard-padding");
      } else {
        this._currentTimeout = window.setTimeout(
          () => element!.classList.remove("keyboard-padding"),
          100,
        );
      }
    }
  }

  //MINI: Download file from URL
  downloadBase64FileURL(url: string) {
    return new Promise<string>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", url, true);
      request.onload = () => {
        MiniAppEvents.hideLoading();
        const response = JSON.parse(request.response);
        if (response.ok && response.result.data) {
          resolve(response.result.data);
        } else {
          reject(response.result.message);
        }
      };
      request.onerror = (error) => {
        MiniAppEvents.hideLoading();
        reject(error);
      };
      request.send();
    });
  }
}

const objMiniApp = new MiniApp();

export default objMiniApp;
