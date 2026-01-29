import api from "../libraries/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const getDocuments = async () => {
  try {
    const res = await api.get(apiPaths.documents.getDocuments);
    return res.data?.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch documents" };
  }
};

export const uploadDocument = async (formData) => {
  try {
    const res = await api.post(apiPaths.documents.upload, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to upload document" };
  }
};

export const deleteDocument = async (id) => {
  try {
    const res = await api.delete(apiPaths.documents.deleteDocument(id));
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete document" };
  }
};

export const getDocumentById = async (id) => {
  try {
    const res = await api.get(apiPaths.documents.getDocumentById(id));
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch document" };
  }
};
