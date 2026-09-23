import { uploadFileToStorage } from "./uploadFile";

export async function getFileUpload(file, authorName, fileTitle) {
  if (!file) return "";
  const uploadedFile = await uploadFileToStorage(file, fileTitle, authorName);
  return uploadedFile.key;
}
