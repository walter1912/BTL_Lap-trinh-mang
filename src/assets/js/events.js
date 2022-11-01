import helpers from './helpers.js';

window.addEventListener( 'load', () => {
    //khi icon chat được click
    document.querySelector( '#toggle-chat-pane' ).addEventListener( 'click', ( e ) => {
        let chatElem = document.querySelector( '#chat-pane' );
        let mainSecElem = document.querySelector( '#main-section' );

        if ( chatElem.classList.contains( 'chat-opened' ) ) {
            chatElem.setAttribute( 'hidden', true );
            mainSecElem.classList.remove( 'col-md-9' );
            mainSecElem.classList.add( 'col-md-12' );
            chatElem.classList.remove( 'chat-opened' );
        }

        else {
            chatElem.attributes.removeNamedItem( 'hidden' );
            mainSecElem.classList.remove( 'col-md-12' );
            mainSecElem.classList.add( 'col-md-9' );
            chatElem.classList.add( 'chat-opened' );
        }
    } );

    //Khi nút 'Create room" được click
    document.getElementById( 'create-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let roomName = document.querySelector( '#room-name' ).value;

        if ( roomName ) {
            //gỡ lỗi tin nhắn
            document.querySelector('#err-msg').innerText = "";


            //tạo link phòng
            let roomLink = `${ location.origin }?room=${ roomName.trim().replace( ' ', '_' ) }_${ helpers.generateRandomString() }`;

            //show message với link phòng room
            document.querySelector( '#room-created' ).innerHTML = `Phòng đã tạo thành công. Click vào <a href='${ roomLink }'>link</a> để vào phòng. 
                Share the room link with your partners.`;

            //cài đặt giá trị trống
            document.querySelector( '#room-name' ).value = '';
        }

        else {
            document.querySelector('#err-msg').innerText = "Cần điền đầy đủ thông tin";
        }
    } );


    //Khi nút 'Enter room' được click
    document.getElementById( 'enter-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let name = document.querySelector( '#username' ).value;

        if ( name ) {
            //gỡ lỗi tin nhắn
            document.querySelector('#err-msg-username').innerText = "";

            //lưu username vào sessionStorage
            sessionStorage.setItem( 'username', name );

            //load lại phòng
            location.reload();
        }

        else {
            document.querySelector('#err-msg-username').innerText = "Vui lòng nhập username";
        }
    } );


    document.addEventListener( 'click', ( e ) => {
        if ( e.target && e.target.classList.contains( 'expand-remote-video' ) ) {
            helpers.maximiseStream( e );
        }

        else if ( e.target && e.target.classList.contains( 'mute-remote-mic' ) ) {
            helpers.singleStreamToggleMute( e );
        }
    } );


    document.getElementById( 'closeModal' ).addEventListener( 'click', () => {
        helpers.toggleModal( 'recording-options-modal', false );
    } );
} );
