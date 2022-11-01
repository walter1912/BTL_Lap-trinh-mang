const stream = (socket) => {
  socket.on("subscribe", (data) => {
    // đăng kí, tham gia phòng họp
    socket.join(data.room);
    socket.join(data.socketId);

    // thông báo cho các thành viên trong cuộc họp về sự xuất hiện của thành viên mới
    if (socket.adapter.rooms.has(data.room) === true) {
      socket.to(data.room).emit("new user", { socketId: data.socketId });
    }
  });

  socket.on("newUserStart", (data) => {
    socket.to(data.to).emit("newUserStart", { sender: data.sender });
  });

  socket.on( 'sdp', ( data ) => {
    socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
} );

socket.on( 'ice candidates', ( data ) => {
    socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
} );

  socket.on("chat", (data) => {
    socket.to(data.room).emit("chat", { sender: data.sender, msg: data.msg });
  });
};
module.exports = stream