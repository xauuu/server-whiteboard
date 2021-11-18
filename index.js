const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const moment = require("moment");
const io = require("socket.io")(server, {
  cors: {
    origin: true,
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("Xau");
});

const PORT = process.env.PORT || 2001;
const rooms = {};
const socketroom = {};
const socketuser = {};
const userList = {};

io.on("connection", (socket) => {
  socket.on("join_room", (roomid, username) => {
    socket.join(roomid);
    socketroom[socket.id] = roomid;
    socketuser[socket.id] = username;

    if (rooms[roomid] && rooms[roomid].length > 0) {
      rooms[roomid].push(socket.id);
      socket.to(roomid).emit("message", `${username} đã vào phòng`);
    } else {
      rooms[roomid] = [socket.id];
    }

    if (userList[roomid] && userList[roomid].length > 0) {
      userList[roomid].push(username);
    } else userList[roomid] = [username];

    io.to(roomid).emit("user_list", userList[roomid]);
  });

  socket.on("chat", (msg, userName, roomID) => {
    io.to(roomID).emit("chat", msg, userName, moment().format("H:mm"));
  });

  socket.on("canvas", (image) => {
    socket.broadcast.to(socketroom[socket.id]).emit("canvas", image);
  });

  socket.on("disconnect", () => {
    if (!socketroom[socket.id]) return;
    socket.to(socketroom[socket.id]).emit("message", `${socketuser[socket.id]} đã rời khỏi phòng`, moment().format("h:mm a")
    );
    const index = rooms[socketroom[socket.id]].indexOf(socket.id);
    io.to(socketroom[socket.id]).emit(
      "user count",
      rooms[socketroom[socket.id]].length
    );
    rooms[socketroom[socket.id]].splice(index, 1);
    delete socketroom[socket.id];
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
