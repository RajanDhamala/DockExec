import axios from "axios";

const LogoutUser=async (clearCurrentUser, navigate) => {
  try {
    await axios.get(
      "http://localhost:8000/users/logout",
      {
        withCredentials: true,
      }
    );
    clearCurrentUser();
    navigate("/auth/login");
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

export {LogoutUser};
