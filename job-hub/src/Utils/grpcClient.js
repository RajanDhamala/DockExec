import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.resolve('./service.proto');
console.log("protopath:",PROTO_PATH)
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition).myservice;

// Change 'localhost:50051' to the actual gRPC server address later
const grpcClient = new proto.MyService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

export default grpcClient;
