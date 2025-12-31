import Router, { response } from "express"
import AuthUser from "../Middlewares/AuthMiddelware.js"
import { execCode, migratedb } from "../Controllers/ApiController.js"
import grpcClient from "../Utils/grpcClient.js"

import countTokenMiddle from "../Middlewares/TokenCountMiddle.js"

const ApiRouter = Router()

ApiRouter.get("/", (req, res) => {

  return res.send("api route is up and running")
})

ApiRouter.post("/exec", AuthUser, countTokenMiddle, execCode)
ApiRouter.get("/db", migratedb)
ApiRouter.post("/valid", async (req, res) => {
  const { fen, move } = req.body;

  if (!fen || !move) {
    return res.status(400).send("Include FEN and move in request");
  }

  const startTime = process.hrtime.bigint(); // starting timer in nanoseconds

  grpcClient.ValidateMove({ fen, move }, (err, response) => {
    const endTime = process.hrtime.bigint();
    const durationMicroSec = Number(endTime - startTime) / 1000;

    if (err) {
      console.error("gRPC Error:", err);
      return res.status(500).send({
        error: "Internal gRPC error",
        durationMicroSec,
      });
    }
    console.log("res", response)
    console.log("The move is valid:", response.isValid);
    console.log("gRPC call duration:", durationMicroSec.toFixed(2), "µs");

    return res.status(200).json({
      success: true,
      data: response,
      durationMicroSec: durationMicroSec.toFixed(2),
    });
  });
});

export default ApiRouter
