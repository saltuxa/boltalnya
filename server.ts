import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getToken } from "next-auth/jwt";
import { registerRealtimeHandlers } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      credentials: true
    }
  });

  io.use(async (socket, nextSocket) => {
    const token = await getToken({
      req: socket.request as never,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    });

    if (!token?.sub) {
      nextSocket(new Error("unauthorized"));
      return;
    }

    socket.data.userId = token.sub;
    socket.data.name = token.name ?? "Пользователь";
    nextSocket();
  });

  registerRealtimeHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`Болтальня запущена: http://${hostname}:${port}`);
  });
});
