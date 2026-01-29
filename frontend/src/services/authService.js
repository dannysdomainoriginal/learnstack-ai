import api from "../libraries/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const login = async (email, password) => {
  try {
    const res = await api.post(apiPaths.auth.login, { email, password });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error logging you in" };
  }
};

export const register = async (username, email, password) => {
  try {
    const res = await api.post(apiPaths.auth.register, {
      username,
      email,
      password,
    });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to sign you up" };
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get(apiPaths.auth.getProfile);
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error fetching your profile" };
  }
};

export const updateProfile = async (userData) => {
  try {
    const res = await api.put(apiPaths.auth.updateProfile, userData);
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error updating your profile" };
  }
};

export const changePassword = async (passwords) => {
  try {
    const res = await api.post(apiPaths.auth.changePassword, passwords);
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error updating your password" };
  }
};
