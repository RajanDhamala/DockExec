import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error"] // optional: logs queries and errors
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
