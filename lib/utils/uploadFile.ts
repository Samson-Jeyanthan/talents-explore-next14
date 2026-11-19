export type UploadedFile = {
  key: string;
  url: string;
};

/** Uploads through the authenticated web proxy so browser code never handles access tokens. */
export async function uploadFileToStorage(
  file: File,
  prefix: string,
  userName: string,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile> {
  const extension = file.name.split(".").pop() || "file";
  const fileName = `${prefix}-${userName || "user"}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const signedUrlResponse = await fetch("/api/s3/signedUrl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!signedUrlResponse.ok) {
    throw new Error("Unable to prepare the attachment upload.");
  }

  const signedUrlData = await signedUrlResponse.json();
  const signedUrl = signedUrlData?.url;
  const key = signedUrlData?.key;
  if (typeof signedUrl !== "string" || typeof key !== "string") {
    throw new Error("The upload service returned an invalid response.");
  }

  if (onProgress) {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", signedUrl);
      request.timeout = 30 * 60 * 1000;
      if (file.type) request.setRequestHeader("Content-Type", file.type);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable)
          onProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          onProgress(100);
          resolve();
        } else
          reject(
            new Error("Unable to upload the attachment. Please try again."),
          );
      };
      request.onerror =
        request.ontimeout =
        request.onabort =
          () =>
            reject(new Error("The upload was interrupted. Please try again."));
      request.send(file);
    });
  } else {
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("Unable to upload the attachment.");
  }

  return { key, url: signedUrl.split("?")[0] };
}
