const express = require('express')

const app = express()

const path = require('path')

app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.get('/', (req, res) => {
    res.sendFile(__dirname+"index.html")
})


const port = process.env.PORT || 3000
const WebSocket = require('ws');

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const wss = new WebSocket.Server({ port });
var rooms = {};

const paramsExist = (data) =>{
  try {
    if('meta' in data && 'roomID' in data && 'clientID' in data && 'message' in data){
      return true;
    }else{
      return false;
    }
  } catch (error) {
    return false;
  }
}

const roomExist = (roomID) =>{
    // check for room is already exist or not
    if(roomID in rooms){
      return true;
    }else{
      return false;
    }
}

const insideRoomdataExist = (arr,data) =>{
  var status = false;
  for(var i =0; i<arr.length;i++){
    if(data in arr[i]){
      status= true;
      break;
    }
  }
  return status;
}

const clientExistInRoom = (roomID,ws,clientID) =>{
  var status = false;
  const data = rooms[roomID];
  for(var i =0; i< data.length ;i++){
    var temp = data[i];
    // if(roomID in temp){
    //   status=true;
    //   console.log("hello world");
    // }
    for(const obj in temp){
      // if(ws == temp[obj]){
      if(clientID == obj){
        status = true;
        break;
      }
    }
  }return status;
}
// create room
const createRoom =(data,ws)=>{
  try {
    var {roomID,clientID} = data;
    const status = roomExist(roomID);
    if(status){
      ws.send(JSON.stringify({
            'message':'room already exist',
            'status':0
          }));
    }else{
      rooms[roomID] = [];
      var obj = {};
      obj[clientID] = ws;
      rooms[roomID].push(obj);
      ws['roomID']=roomID;
      ws['clientID']=clientID;
      ws['admin']=true;
      ws.send(JSON.stringify({
        'message':'room created succesfully',
        'status':1
      }));
    }
  } catch (error) {
    ws.send(JSON.stringify({
      'message':'there was some problem in creating a room',
      'status':0
    }));
  }
}

// join room 
const joinRoom = (data,ws) => {
  try {
    var {roomID,clientID} = data;
    // check if room exist or not
    const roomExist = roomID in rooms;
    if(!roomExist){
      ws.send(JSON.stringify({
        'message':'Check room id',
        'status':0
      }));
      return;
    }
    // const inRoom = insideRoomdataExist(rooms[roomID],clientID);
    const inRoom = clientExistInRoom(roomID,ws,clientID)
    if(inRoom){
      ws.send(JSON.stringify({
        "message":"you are already in a room",
        "status":0
      }));
    }else{
      var obj = {};
      obj[clientID] = ws;
      rooms[roomID].push(obj);
      ws['roomID']=roomID
      ws['clientID']=clientID;
      ws.send(JSON.stringify({
      "message":"Joined succesfully",
      "status":1
    }));
    }
  } catch (error) {
    ws.send(JSON.stringify({
      'message':'there was some problem in joining a room',
      'status':0
    }));
  }
}

// send message 
const sendMessage = (data,ws,Status=null) => {
  try {
    var {roomID, message,clientID} = data;
    //check whether room exist or not
    const roomExist = roomID in rooms;
    if(!roomExist){
      ws.send(JSON.stringify({
        'message':'Check room id',
        'status':0
      }));
      return;
    }
    // check whether client is in room or not
    const clientExist = clientExistInRoom(roomID,ws,clientID);
    if(!clientExist){
      ws.send(JSON.stringify({
        'message':"You are not allowed to send message",
        'status':0
      }));
      return;
    }
    const obj = rooms[roomID];
    for(i=0;i<obj.length;i++){
      var temp = obj[i];
      for(var innerObject in temp){
        var wsClientID = temp[innerObject];
        if(ws!==wsClientID){
          wsClientID.send(JSON.stringify({
            'message':message,
            'status':Status?Status:1
          }));
        }
      }
    }
  } catch (error) {
    ws.send(JSON.stringify({
      'message':'There was some problem in sending message',
      'status':0
    }));
  }
}

const leaveRoom = (ws,data) => {
  try {
    const {roomID} = data;
    // manual code started------------------------------------------------------------
    const roomExist = roomID in rooms;
    if(!roomExist){
      ws.send(JSON.stringify({
        'message':'Check room id',
        'status':0
      }));
      return;
    }
    if('admin' in ws){
      data['message']="Admin left the room.";
      sendMessage(data,ws,Status=2);
      delete rooms[ws.roomID]
      return;
    }
    else{
      // find the index of object
      lst_obj = rooms[roomID];
      var index = null;
      for(let i=0;i<lst_obj.length;i++){
        var temp_obj = lst_obj[i];
        for(var key in temp_obj){
          var temp_inside = temp_obj[key]
          if('admin' in temp_inside){
            temp_inside.send(JSON.stringify({
              'message':'Somebody leave the room',
              'status':3
            }));
          }
          if(ws==temp_inside){
            index =i;
          }
        }
      }
      if(index!=null){
        rooms[roomID].splice(index,1);
        console.log((rooms[roomID].length));
      }
    }


  } catch (error) {
    ws.send(JSON.stringify({
      'message':'There was some problem----------------------',
      'status':0
    }))
  }
  
}

const available_room = (ws) =>{
  try {
    var available_room_id=[];
    for(var i in rooms){
      available_room_id.push(parseInt(i));
    }
    ws.send(JSON.stringify({
      "rooms":available_room_id,
      "status":4
    }))
  } catch (error) {
    ws.send(JSON.stringify({
      'message':'There was some problem----------------------',
      'status':0
    }))
  }
}

wss.on('connection', function connection(ws) {
  try {
    ws.on('message',(recieveData)=>{
      var data = JSON.parse(recieveData);
      const error = paramsExist(data);
      if(!error){
        ws.send(JSON.stringify({
          'message':'check params',
          'status':0
        }));
        return;
      }
      var {roomID,meta} = data;
      switch (meta) {
        case "create_room":
          createRoom(data,ws);
          console.log(rooms);
          break;
        
        case "join_room":
          joinRoom(data,ws);
          console.log(rooms);
          break;
          
        case "send_message":
          sendMessage(data,ws);
          console.log(rooms);
          break;

        case "show_all_rooms":
          ws.send(JSON.stringify({
            "rooms":[rooms]
          }))
          break;
        default:
          ws.send(JSON.stringify({
            "message":"Unsupported meta data provided provide valid data",
            "status":0
          }));
          break;
      }
    })
    ws.on('close', function(data) {
      leaveRoom(ws,{roomID:ws.roomID,clientID:ws.clientID,message:"Leave request"})
      ws.terminate();
    });

    ws.on('pong', heartbeat);
  } catch (error) {
    ws.send(JSON.stringify({
      "message":"there was some problem",
      "status":0
    }))
  }
});
const interval = setInterval(function ping() {
  var a = wss.clients;
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      leaveRoom(ws,{roomID:ws.roomID,clientID:ws.clientID});
      ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 50000);

const serverFree = setInterval(()=>{
  var removeKey = [];
  for(const obj in rooms){
    if(rooms[obj].length<1){
      removeKey.push(obj);
    }
  }
  for(var i =0; i<removeKey.length;i++){
    delete rooms[removeKey[i]];
  }
},30000)