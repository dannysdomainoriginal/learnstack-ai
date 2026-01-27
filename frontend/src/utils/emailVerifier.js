import axios from "axios";

export const verifyEmail = async (email) => {
  const apiUrl = "https://open.kickbox.com/v1/disposable/";
  const disposable = await axios
    .get(`${apiUrl}${encodeURIComponent(email)}`)
    .then((res) => res.data.disposable)
    .catch(() => false);

  console.log(disposable);
  return !disposable;
};
