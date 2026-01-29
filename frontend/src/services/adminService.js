import api from "../libraries/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const getAdminDashboard = async () => {
  try {
    const res = await api.get(apiPaths.admin.getDashboard);
    return res.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "We encountered an error trying to load your dashboard",
      }
    );
  }
};

export const getAnalyticsData = async () => {
  return new Promise(() => {})
}