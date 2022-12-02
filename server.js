const express = require("express")
const http = require("http");
const { Server } = require("socket.io");

const app = express()
const server = http.createServer(app)
const io = new Server(server);

let CurrentUsers = []

app.use(express.static(__dirname + '/public'));

app.get("/",(req,res)=>{
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', (socket) => {
    socket.emit("ServerList",CurrentUsers)
    socket.on("NewUser",(user,curposition,curangle)=>{
        console.log(`New user joined ${user} with session ${socket.id}`)
        socket.broadcast.emit("ServerNewUser",user,socket.id)
        CurrentUsers.push({session:socket.id,username:user,position:curposition,angle:curangle})
        console.log(`${curposition.x},${curposition.y} against spawn of ${25*128},${10*128}`)
    })
    socket.on("SetSpeed",(speed,position,angle)=>{
        index = CurrentUsers.findIndex(e=>e.session==socket.id)
        CurrentUsers[index].position = position
        CurrentUsers[index].angle = angle
        socket.broadcast.emit("ServerSetSpeed",speed,socket.id)
    })
    socket.on("SetAngle",(angle,position,curangle)=>{
        index = CurrentUsers.findIndex(e=>e.session==socket.id)
        CurrentUsers[index].position = position
        CurrentUsers[index].angle = curangle
        socket.broadcast.emit("ServerSetAngle",angle,socket.id)
    })
    console.log('a user connected');
    socket.on("disconnect",()=>{
        socket.broadcast.emit("ServerDelete",socket.id)
        index = CurrentUsers.findIndex(e=>e.session==socket.id)
        CurrentUsers.splice(index,1)
        console.log("user disconnect")
    })
  });

  

server.listen(8080,()=>{
    console.log("server running")
})