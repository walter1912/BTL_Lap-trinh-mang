let express = require("express");
let http = require("http");
let io = require('socket.io')
let app = express();
// let server = require( 'http' ).Server( app );
// let io = require( 'socket.io' )( server );
// khởi tạo server http
const server = http.createServer(app)
// khởi tạo WebSocket server
const wss = new ws.Server({server})
wss.of('/stream').on('connection', stream)
let path = require("path");
// let favicon = require( 'serve-favicon' );

// app.use( favicon( path.join( __dirname, 'favicon.ico' ) ) );
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.of("/stream").on("connection", stream);

server.listen(3000);
