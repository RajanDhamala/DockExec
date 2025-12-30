import axios from "axios";


const api = axios.create({
  baseURL: "http://localhost:8000/profile",
  withCredentials: true, // automatically sends cookies
});

// ALl worlflow helper functions related to profile management
// Recent probelms helper


export const getRecentProblemLogs = async (problemId) => {
  return api.get(`/recentExeViews/${problemId}`).then(res => res.data);
}

export const DelRecentProblem = async (problemId) => {
  return api.delete(`/delRecentExe/${problemId}`).then(res => res.data);
}

export const getAvgProblemLogs = async (problemId) => {
  return api.get(`/avgTestLogs/${problemId}`).then(res => res.data);
}

export const deleteAvgProblem = async (problemId) => {
  console.log("delete request got:", problemId);
  return api.delete(`/avgTest/${problemId}`).then(res => res.data);
};

//Print Exections
export const getPrintLogs = async (problemId) => {
  return api.get(`/printTestOutput/${problemId}`).then(res => res.data);
}

// export const rerunPrint = async ({ problemId, runId }) => {
//   return api.get(`/printCase_id/${problemId}/${runId}`).then(res => res.data);
// }

export const deletePrint = async (runId) => {
  console.log("but i doent req del req", runId)
  return api.delete(`/DelprintCase_id/${runId}`).then(res => res.data);
}

// PROGRAMMIZ 
export const getProgrammizOutput = async (runId) => {
  return api.get(`/viewProgrammizOutput/${runId}`).then(res => res.data);
}

// export const rerunProgrammiz = async (runId) => {
//   return api.get(`/reRunProgrammiz/${runId}`).then(res => res.data);
// }

export const ApideleteProgrammiz = async (runId) => {
  return api.delete(`/deleteProgrammiz/${runId}`).then(res => res.data);
}








