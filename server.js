import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const app = express();
const server = createServer(app);

app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("hello from server");
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  socket.emit("hello", "hello from server!");
  socket.broadcast.emit("hello", `${socket.id} joined the server`);

  socket.on("message", (data) => {
    socket.broadcast.emit("re-message", data);
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  // user discounnected
  socket.on("disconnect", () => {
    console.log("user Disconected", socket.id);
  });
});

server.listen(4000, () => {
  console.log("server connected");
});
