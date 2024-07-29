export const getFileType = (base64Data: string) => {
  const firstChar = base64Data.charAt(0);
  switch (firstChar) {
    case "/":
      return { ext: ".jpg", mime: "image/jpeg" };
    case "i":
      return { ext: ".png", mime: "image/png" };
    case "R":
      return { ext: ".gif", mime: "image/gif" };
  }

  ///Assume PNG by default as this is what is sent by mini-app
  return { ext: ".png", mime: "image/png" };
};
