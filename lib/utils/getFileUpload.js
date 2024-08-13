import axiosInstance from "../config/axiosInstance";
import { toast } from "sonner";

export async function getFileUpload(file, authorName, fileTitle) {
  if (!file) return null;

  const image = file.name;
  const ext = image.split(".").pop();
  const key = `${fileTitle}-${authorName}-${Date.now()}.${ext}`;

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const formData = {
        fileName: key,
        contentType: file.type,
      };
      const signedUrlResult = await axiosInstance.post(
        "/s3/signedUrl",
        formData
      );
      console.log(signedUrlResult, "signed--url--result");

      if (signedUrlResult.status === 201) {
        const signedUrl = signedUrlResult.data.url;
        try {
          const res = await fetch(signedUrl, {
            method: "PUT",
            body: file,
          });
          console.log(res, "res of signed url");
          if (res.ok) {
            resolve(signedUrlResult.data.key);
          } else {
            reject(toast.error("File upload failed", { duration: 4000 }));
          }
        } catch {
          reject(toast.error("File upload failed", { duration: 4000 }));
        }
      } else {
        reject(toast.error("Failed to get signed URL", { duration: 4000 }));
      }
    } catch (error) {
      console.log(error);
      reject(toast.error("Failed to get axios URL", { duration: 4000 }));
    }
  });
}
