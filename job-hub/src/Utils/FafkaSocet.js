import { getIO } from "./SocketProvider.js";

const emitSingleTestresult = async (data) => {
  try {
    const io = getIO();
    io.to(data.socketId).emit("test_result", data)
    console.log("emmited to ", data.socketId)
  } catch (err) {
    console.error("️ Cannot emit test result:", err.message);
  }
};

const emitBlockedresult = async (data) => {
  try {
    const io = getIO()
    io.to(data.socketId).emit("blocked_result", data)
    console.log("test reuslt blocked emitted", data.socketId)
  } catch (error) {
    console.log("error cannot emit", error)
  }
}

const emitAllCaseResult = async (data) => {
  try {
    const io = getIO();

    if (!data.jobId || !data.jobId.trim() || !data.testCaseId || !data.testCaseId.trim()) {
      console.log("Skipping empty/dummy test result");
      return;
    } else {
      io.to(data.socketId).emit("test_result", data);

    }

    // emit test result

  } catch (err) {
    console.log("Error cannot emit:", err);
  }
};

const emitProgrammizResult = async (data) => {
  const io = getIO();
  if (!data.jobId) {
    console.log("cannot elmit no job id")
  }
  io.to(data.socketId).emit("programmiz_result", data)
}


export {
  emitSingleTestresult, emitBlockedresult, emitAllCaseResult, emitProgrammizResult
}
