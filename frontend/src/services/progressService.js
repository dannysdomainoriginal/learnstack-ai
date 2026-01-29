import api from "../libraries/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const getDashboardData = async () => {
  try {
    const res = await api.get(apiPaths.progress.getDashboardData);
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch dashboard data" };
  }
};
