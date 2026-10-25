export type UploadedFile = {
  key: string;
  url: string;
};

/** Uploads through the authenticated web proxy so browser code never handles access tokens. */
export async function uploadFileToStorage(
  file: File,
  prefix: string,
  userName: string
): Promise<UploadedFile> {
  const extension = file.name.split(".").pop() || "file";
  const fileName = `${prefix}-${userName || "user"}-${Date.now()}.${extension}`;
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
  console.log("signedUrlData", signedUrlData);
  const signedUrl = signedUrlData?.url;
  const key = signedUrlData?.key;
  if (typeof signedUrl !== "string" || typeof key !== "string") {
    throw new Error("The upload service returned an invalid response.");
  }

  const uploadResponse = await fetch(signedUrl, { method: "PUT", body: file });
  if (!uploadResponse.ok) {
    throw new Error("Unable to upload the attachment.");
  }

  console.log("uploadResponse", uploadResponse);
  console.log("signedUrl", signedUrl);

  return { key, url: signedUrl.split("?")[0] };
  // url: signedUrl.split("?")[0]
}
