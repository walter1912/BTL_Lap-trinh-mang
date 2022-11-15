const stream = (websocket) => {
  websocket.on("subscribe", (data) => {
    // đăng kí, tham gia phòng họp
    websocket.join(data.room);
    websocket.join(data.socketId);

    // thông báo cho các thành viên trong cuộc họp về sự xuất hiện của thành viên mới
    if (websocket.adapter.rooms.has(data.room) === true) {
      websocket.to(data.room).emit("new user", { socketId: data.socketId });
    }
  });

  websocket.on("newUserStart", (data) => {
    websocket.to(data.to).emit("newUserStart", { sender: data.sender });
  });

  websocket.on( 'sdp', ( data ) => {
    websocket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
} );

websocket.on( 'ice candidates', ( data ) => {
    websocket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
} );

  websocket.on("chat", (data) => {
    websocket.to(data.room).emit("chat", { sender: data.sender, msg: data.msg });
  });
};
module.exports = stream