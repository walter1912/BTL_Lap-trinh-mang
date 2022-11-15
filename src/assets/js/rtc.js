
 import help from './helpers.js';

 window.addEventListener( 'load', () => {
     const room = help.getQString( location.href, 'room' );
     const username = sessionStorage.getItem( 'username' );
 
     if ( !room ) {
        // tạo phòng khi chưa có phòng 
         document.querySelector( '#room-create' ).attributes.removeNamedItem( 'hidden' );
     }
 
     else if ( !username ) {
        // đặt tên người dùng
         document.querySelector( '#username-set' ).attributes.removeNamedItem( 'hidden' );
     }
  // xử lý khi phòng đã có người
     else {
         let commElem = document.getElementsByClassName( 'room-comm' );
 
         for ( let i = 0; i < commElem.length; i++ ) {
             commElem[i].attributes.removeNamedItem( 'hidden' );
         }
 
         var pc = [];
 
         let socket = io( '/stream' );
 
         var socketId = '';
         var randomNumber = `__${help.generateRandomString()}__${help.generateRandomString()}__`;
         var myStream = '';
         var screen = '';
         var recordedStream = [];
         var mediaRecorder = '';
 
         // lấy camera người dùng
         getAndSetUserStream();
 
 
         socket.on( 'connection', () => {
             //set socketId
             socketId = socket.io.engine.id;
             document.getElementById('randomNumber').innerText = randomNumber;
 
            // gửi dữ liệu subscribe về phía server
            // xử lý khi có người đăng ký thành công
             socket.emit( 'subscribe', {
                 room: room,
                 socketId: socketId
             } );
 
            //  xử lý khi có người dùng mới
             socket.on( 'new user', ( data ) => {
                 socket.emit( 'newUserStart', { to: data.socketId, sender: socketId } );
                 pc.push( data.socketId );
                 init( true, data.socketId );
             } );
 
            
             socket.on( 'newUserStart', ( data ) => {
                 pc.push( data.sender );
                 init( false, data.sender );
             } );
 
 
             socket.on( 'ice candidates', async ( data ) => {
                 data.candidate ? await pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
             } );
 
 
             socket.on( 'sdp', async ( data ) => {
                 if ( data.description.type === 'offer' ) {
                     data.description ? await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';
 
                     help.getUserFullMedia().then( async ( stream ) => {
                         if ( !document.getElementById( 'local' ).srcObject ) {
                             help.setLocalStream( stream );
                         }
 
                         //lưu stream 
                         myStream = stream;
 
                         stream.getTracks().forEach( ( track ) => {
                             pc[data.sender].addTrack( track, stream );
                         } );
 
                         let answer = await pc[data.sender].createAnswer();
 
                         await pc[data.sender].setLocalDescription( answer );
 
                         socket.emit( 'sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId } );
                     } ).catch( ( e ) => {
                         console.error( e );
                     } );
                 }
 
                 else if ( data.description.type === 'answer' ) {
                     await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
                 }
             } );
 
            //  xử lý chat
             socket.on( 'chat', ( data ) => {
                 help.addChat( data, 'remote' );
             } );
         } );
 
 
         function getAndSetUserStream() {
             help.getUserFullMedia().then( ( stream ) => {
                 //lưu stream
                 myStream = stream;
 
                 help.setLocalStream( stream );
             } ).catch( ( e ) => {
                 console.error( `stream error: ${ e }` );
             } );
         }
 
//  gửi tin nhắn
         function sendMsg( msg ) {
             let data = {
                 room: room,
                 msg: msg,
                 sender: `${username} (${randomNumber})`
             };
 
             //emit chat message
             socket.emit( 'chat', data );
 
             //add localchat
             help.addChat( data, 'local' );
         }
 
 
 
         function init( createOffer, partnerName ) {
             pc[partnerName] = new RTCPeerConnection( help.getIceServer() );
            //  ktra màn hình
             if ( screen && screen.getTracks().length ) {
                 screen.getTracks().forEach( ( track ) => {
                     pc[partnerName].addTrack( track, screen );
                 } );
             }
            //  kiểm tra camera
             else if ( myStream ) {
                 myStream.getTracks().forEach( ( track ) => {
                     pc[partnerName].addTrack( track, myStream );
                 } );
             }
 
             else {
                 help.getUserFullMedia().then( ( stream ) => {
                     //save my stream
                     myStream = stream;
 
                     stream.getTracks().forEach( ( track ) => {
                         pc[partnerName].addTrack( track, stream );
                     } );
 
                     help.setLocalStream( stream );
                 } ).catch( ( e ) => {
                     console.error( `stream error: ${ e }` );
                 } );
             }
 
 
 
             //create offer
             if ( createOffer ) {
                 pc[partnerName].onnegotiationneeded = async () => {
                     let offer = await pc[partnerName].createOffer();
 
                     await pc[partnerName].setLocalDescription( offer );
 
                     socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId } );
                 };
             }
 
 
 
             //send ice candidate to partnerNames
             pc[partnerName].onicecandidate = ( { candidate } ) => {
                 socket.emit( 'ice candidates', { candidate: candidate, to: partnerName, sender: socketId } );
             };
 
 
 
             //add
             pc[partnerName].ontrack = ( e ) => {
                 let str = e.streams[0];
                 if ( document.getElementById( `${ partnerName }-video` ) ) {
                     document.getElementById( `${ partnerName }-video` ).srcObject = str;
                 }
 
                 else {
                     //video elem
                     let newVid = document.createElement( 'video' );
                     newVid.id = `${ partnerName }-video`;
                     newVid.srcObject = str;
                     newVid.autoplay = true;
                     newVid.className = 'remote-video';
 
                     //video controls elements
                     let controlDiv = document.createElement( 'div' );
                     controlDiv.className = 'remote-video-controls';
                     controlDiv.innerHTML = `<i class="fa-solid fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                         <i class="fa-solid fa-expand text-white expand-remote-video" title="Expand"></i>`;
 
                     //tạo 1 thẻ div cho card
                     let cardDiv = document.createElement( 'div' );
                     cardDiv.className = 'card card-sm';
                     cardDiv.id = partnerName;
                     cardDiv.appendChild( newVid );
                     cardDiv.appendChild( controlDiv );
 
                     //put div vào main-section elem
                     document.getElementById( 'videos' ).appendChild( cardDiv );
 
                     help.adjustVideoElemSize();
                 }
             };
 
 
 
             pc[partnerName].onconnectionstatechange = ( d ) => {
                 switch ( pc[partnerName].iceConnectionState ) {
                     case 'disconnected':
                     case 'failed':
                         help.closeVideo( partnerName );
                         break;
 
                     case 'closed':
                         help.closeVideo( partnerName );
                         break;
                 }
             };
 
 
 
             pc[partnerName].onsignalingstatechange = ( d ) => {
                 switch ( pc[partnerName].signalingState ) {
                     case 'closed':
                         console.log( "Signalling state is 'closed'" );
                         help.closeVideo( partnerName );
                         break;
                 }
             };
         }
 
 
        //  chia sẻ màn hình
         function shareScreen() {
             help.shareScreen().then( ( stream ) => {
                 help.toggleShareIcons( true );
 
                 //tắt btns chuyển đổi video trong khi chia sẻ màn hình. 
                //  để đảm bảo việc nhấp vào btn không ảnh hưởng đến việc chia sẻ màn hình
                  // Nó sẽ được bật khi người dùng ngừng chia sẻ màn hình
                 help.toggleVideoBtnDisabled( true );
 
                 //lưu screen stream
                 screen = stream;
 
                 //chia sẻ với mọi người
                 broadcastNewTracks( stream, 'video', false );
 
                 //Khi nhấp vào nút dừng chia sẻ do trình duyệt hiển thị
                 screen.getVideoTracks()[0].addEventListener( 'ended', () => {
                     stopSharingScreen();
                 } );
             } ).catch( ( e ) => {
                 console.error( e );
             } );
         }
 
 
        //  dừng chia sẻ màn hình
         async function stopSharingScreen() {
             //enable video toggle btn
             help.toggleVideoBtnDisabled( false );
 
             try {
                 await new Promise((res, rej) => {
                     screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

                     res();
                 });
                 help.toggleShareIcons(false);
                 broadcastNewTracks(myStream, 'video');
             } catch (e) {
                 console.error(e);
             }
         }
 
 
 
         function broadcastNewTracks( stream, type, mirrorMode = true ) {
             help.setLocalStream( stream, mirrorMode );
 
             let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
 
             for ( let p in pc ) {
                 let pName = pc[p];
 
                 if ( typeof pc[pName] == 'object' ) {
                     help.replaceTrack( track, pc[pName] );
                 }
             }
         }
 
 
         function toggleRecordingIcons( isRecording ) {
             let e = document.getElementById( 'record' );
 
             if ( isRecording ) {
                 e.setAttribute( 'title', 'Stop recording' );
                 e.children[0].classList.add( 'text-danger' );
                 e.children[0].classList.remove( 'text-white' );
             }
 
             else {
                 e.setAttribute( 'title', 'Record' );
                 e.children[0].classList.add( 'text-white' );
                 e.children[0].classList.remove( 'text-danger' );
             }
         }
 
        //  record màn hình
         function startRecording( stream ) {
             mediaRecorder = new MediaRecorder( stream, {
                 mimeType: 'video/webm;codecs=vp9'
             } );
 
             mediaRecorder.start( 1000 );
             toggleRecordingIcons( true );
 
             mediaRecorder.ondataavailable = function ( e ) {
                 recordedStream.push( e.data );
             };
 
             mediaRecorder.onstop = function () {
                 toggleRecordingIcons( false );
 
                 help.saveRecordedStream( recordedStream, username );
 
                 setTimeout( () => {
                     recordedStream = [];
                 }, 3000 );
             };
 
             mediaRecorder.onerror = function ( e ) {
                 console.error( e );
             };
         }
 
         document.getElementById('chat-input-btn').addEventListener('click',(e) => {
             console.log("here: ",document.getElementById('chat-input').value)
             if (  document.getElementById('chat-input').value.trim()  ) {
                 sendMsg( document.getElementById('chat-input').value );
 
                 setTimeout( () => {
                     document.getElementById('chat-input').value = '';
                 }, 50 );
             }
         });
 
         //nhấn vào phím enter thì thực hiện gửi tin nhắn
                  document.getElementById( 'chat-input' ).addEventListener( 'keypress', ( e ) => {
             if ( e.which === 13 && ( e.target.value.trim() ) ) {
                 e.preventDefault();
 
                 sendMsg( e.target.value );
 
                 setTimeout( () => {
                     e.target.value = '';
                 }, 50 );
             }
         } );
 
 
         //khi click vào icon video
         document.getElementById( 'toggle-video' ).addEventListener( 'click', ( e ) => {
             e.preventDefault();
 
             let elem = document.getElementById( 'toggle-video' );
 
             if ( myStream.getVideoTracks()[0].enabled ) {
                 e.target.classList.remove( 'fa-video' );
                 e.target.classList.add( 'fa-video-slash' );
                 elem.setAttribute( 'title', 'Hiển thị Video' );
 
                 myStream.getVideoTracks()[0].enabled = false;
             }
 
             else {
                 e.target.classList.remove( 'fa-video-slash' );
                 e.target.classList.add( 'fa-video' );
                 elem.setAttribute( 'title', 'Ẩn Video' );
 
                 myStream.getVideoTracks()[0].enabled = true;
             }
 
             broadcastNewTracks( myStream, 'video' );
         } );
 
 
         //khi icon mute được click
         document.getElementById( 'toggle-mute' ).addEventListener( 'click', ( e ) => {
             e.preventDefault();
 
             let elem = document.getElementById( 'toggle-mute' );
 
             if ( myStream.getAudioTracks()[0].enabled ) {
                 e.target.classList.remove( 'fa-microphone-alt' );
                 e.target.classList.add( 'fa-microphone-alt-slash' );
                 elem.setAttribute( 'title', 'Unmute' );
 
                 myStream.getAudioTracks()[0].enabled = false;
             }
 
             else {
                 e.target.classList.remove( 'fa-microphone-alt-slash' );
                 e.target.classList.add( 'fa-microphone-alt' );
                 elem.setAttribute( 'title', 'Mute' );
 
                 myStream.getAudioTracks()[0].enabled = true;
             }
 
             broadcastNewTracks( myStream, 'audio' );
         } );
 
 
         //khi người dùng click 'Share screen'
         document.getElementById( 'share-screen' ).addEventListener( 'click', ( e ) => {
             e.preventDefault();
 
             if ( screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended' ) {
                 stopSharingScreen();
             }
 
             else {
                 shareScreen();
             }
         } );
 
 
         //khi người dùng click record 
         document.getElementById( 'record' ).addEventListener( 'click', ( e ) => {
             /**
              * hỏi xem người dùng muốn chọn record cái gì
              * get stream được chọn và bắt đầu quay
              */
             if ( !mediaRecorder || mediaRecorder.state == 'inactive' ) {
                 help.toggleModal( 'recording-options-modal', true );
             }
 
             else if ( mediaRecorder.state == 'paused' ) {
                 mediaRecorder.resume();
             }
 
             else if ( mediaRecorder.state == 'recording' ) {
                 mediaRecorder.stop();
             }
         } );
 
 
         //khi người dùng chọn record màn hình
         document.getElementById( 'record-screen' ).addEventListener( 'click', () => {
            // disable nút record
             help.toggleModal( 'recording-options-modal', false );
            // bắt đầu record
             if ( screen && screen.getVideoTracks().length ) {
                 startRecording( screen );
             }
 
             else {
                // bật tính năng chia sẻ màn hình và bắt dầu record
                 help.shareScreen().then( ( screenStream ) => {
                     startRecording( screenStream );
                 } ).catch( () => { } );
             }
         } );
 
 
         //khi người dùng chọn record camera
         document.getElementById( 'record-video' ).addEventListener( 'click', () => {
            // disable nút record
             help.toggleModal( 'recording-options-modal', false );
            // bắt đàu record
             if ( myStream && myStream.getTracks().length ) {
                 startRecording( myStream );
             }
 
             else {
                // bật camera và bắt đầu record
                 help.getUserFullMedia().then( ( videoStream ) => {
                     startRecording( videoStream );
                 } ).catch( () => { } );
             }
         } );
     }
 } );
 