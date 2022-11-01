export default {
  generateRandomString() {
    // cho phép quyền truy cập vào các dịch vụ liên quan đến mật mã nhất định.
    var crypto = window.crypto || window.msCrypto;
    let array = new Uint32Array(1);

    return crypto.getRandomValues(array);
  },

  closeVideo(elemId) {
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
      this.adjustVideoElemSize();
    }
  },

  pageHasFocus() {
    return !(
      document.hidden ||
      document.onfocusout ||
      window.onpagehide ||
      window.onblur
    );
  },
  //   lấy câu truy vấn
  getQString(url = "", keyToReturn = "") {
    url = url ? url : location.href;
    let queryStrings = decodeURIComponent(url)
      .split("#", 2)[0]
      .split("?", 2)[1];

    if (queryStrings) {
      let splittedQStrings = queryStrings.split("&");
      if (splittedQStrings.length) {
        let queryStringObj = {};

        splittedQStrings.forEach((keyValuePair) => {
          let keyValue = keyValuePair.split("=", 2);

          if (keyValue.length) {
            queryStringObj[keyValue[0]] = keyValue[1];
          }
        });

        return keyToReturn
          ? queryStringObj[keyToReturn]
            ? queryStringObj[keyToReturn]
            : null
          : queryStringObj;
      }
      return null;
    }
    return null;
  },

  userMediaAvailable() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  },

  getUserFullMedia() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("Thiết bị của bạn không hỗ trợ");
    }
  },

  getUserAudio() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("Thiết bị của bạn không hỗ trợ audio");
    }
  },

  shareScreen() {
    if (this.userMediaAvailable()) {
      if (!navigator.mediaDevices?.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
      } else {
        // List cameras and microphones.
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => {
            devices.forEach((device) => {
              console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
            });
          })
          .catch((err) => {
            console.error(`${err.name}: ${err.message}`);
          });
      }
      return navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: true
        // {
        //   echoCancellation: true,
        //   noiseSuppression: true,
        //   sampleRate: 44100,
        // },
      });
    } else {
      throw new Error("Thiết bị của bạn không hỗ trợ share màn hình");
    }
  },

  getIceServer() {
    return {
      iceServers: [
        {
          urls: ["stun:eu-turn4.xirsys.com"],
        },
        {
          username:
            "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
          credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
          urls: [
            "turn:eu-turn4.xirsys.com:80?transport=udp",
            "turn:eu-turn4.xirsys.com:3478?transport=tcp",
          ],
        },
      ],
    };
  },

  addChat(data, senderType) {
    let chatMsgDiv = document.querySelector("#chat-messages");
    let contentAlign = "justify-content-end";
    let senderName = "You";
    let msgBg = "bg-white";

    if (senderType === "remote") {
      contentAlign = "justify-content-start";
      senderName = data.sender;
      msgBg = "";
    }

    let infoDiv = document.createElement("div");
    infoDiv.className = "sender-info";
    infoDiv.innerText = `${senderName} - ${moment().format(
      "Do MMMM, YYYY h:mm a"
    )}`;

    let colDiv = document.createElement("div");
    colDiv.className = `col-10 card chat-card msg ${msgBg}`;
    colDiv.innerHTML = xssFilters
      .inHTMLData(data.msg)
      .autoLink({ target: "_blank", rel: "nofollow" });

    let rowDiv = document.createElement("div");
    rowDiv.className = `row ${contentAlign} mb-2`;

    colDiv.appendChild(infoDiv);
    rowDiv.appendChild(colDiv);
    chatMsgDiv.appendChild(rowDiv);

    if (this.pageHasFocus) {
      rowDiv.scrollIntoView();
    }
  },

  replaceTrack(stream, recipientPeer) {
    let sender = recipientPeer.getSenders
      ? recipientPeer
          .getSenders()
          .find((s) => s.track && s.track.kind === stream.kind)
      : false;
    sender ? sender.replaceTrack(stream) : "";
  },

  toggleShareIcons(share) {
    let shareIconElem = document.querySelector("#share-screen");

    if (share) {
      shareIconElem.setAttribute("title", "Dừng chia sẻ màn hình");
      shareIconElem.children[0].classList.add("text-primary");
      shareIconElem.children[0].classList.remove("text-white");
    } else {
      shareIconElem.setAttribute("title", "Chia sẻ màn hình");
      shareIconElem.children[0].classList.add("text-white");
      shareIconElem.children[0].classList.remove("text-primary");
    }
  },
  toggleVideoBtnDisabled(disabled) {
    document.getElementById("toggle-video").disabled = disabled;
  },
  maximiseStream(e) {
    // lấy các element cùng nằm trong 1 thẻ parent nhưng xuất hiện trước
    let elem = e.target.parentElement.previousElementSibling;
    // yêu cầu phóng to toàn màn hình, với các hàm ở các thiết bị khác nhau
    elem.requestFullscreen() ||
      elem.mozRequestFullScreen() ||
      elem.webkitRequestFullscreen() ||
      elem.msRequestFullscreen();
  },

  singleStreamToggleMute(e) {
    if (e.target.classList.contains("fa-microphone")) {
      e.target.parentElement.previousElementSibling.muted = true;
      e.target.classList.add("fa-microphone-slash");
      e.target.classList.remove("fa-microphone");
    } else {
      e.target.parentElement.previousElementSibling.muted = false;
      e.target.classList.add("fa-microphone");
      e.target.classList.remove("fa-microphone-slash");
    }
  },

  //   lưu bản ghi màn hình su dung FileSave.js
  saveRecordedStream(stream, user) {
    let blob = new Blob(stream, { type: "video/webm" });
    let file = new File([blob], `${user}-${moment().unix()}-record.webm`);

    saveAs(file);
  },

  toggleModal(id, show) {
    let el = document.getElementById(id);

    if (show) {
      el.style.display = "block";
      el.removeAttribute("aria-hidden");
    } else {
      el.style.display = "none";
      el.setAttribute("aria-hidden", true);
    }
  },

  setLocalStream(stream, mirrorMode = true) {
    const localVidElem = document.getElementById("local");

    localVidElem.srcObject = stream;
    mirrorMode
      ? localVidElem.classList.add("mirror-mode")
      : localVidElem.classList.remove("mirror-mode");
  },

  adjustVideoElemSize() {
    let elem = document.getElementsByClassName("card");
    let totalRemoteVideosDesktop = elem.length;
    let newWidth =
      totalRemoteVideosDesktop <= 2
        ? "50%"
        : totalRemoteVideosDesktop == 3
        ? "33.33%"
        : totalRemoteVideosDesktop <= 8
        ? "25%"
        : totalRemoteVideosDesktop <= 15
        ? "20%"
        : totalRemoteVideosDesktop <= 18
        ? "16%"
        : totalRemoteVideosDesktop <= 23
        ? "15%"
        : totalRemoteVideosDesktop <= 32
        ? "12%"
        : "10%";

    for (let i = 0; i < totalRemoteVideosDesktop; i++) {
      elem[i].style.width = newWidth;
    }
  },

  createDemoRemotes(str, total = 6) {
    let i = 0;

    let testInterval = setInterval(() => {
      let newVid = document.createElement("video");
      newVid.id = `demo-${i}-video`;
      newVid.srcObject = str;
      newVid.autoplay = true;
      newVid.className = "remote-video";

      //video controls elements
      let controlDiv = document.createElement("div");
      controlDiv.className = "remote-video-controls";
      controlDiv.innerHTML = `<i class="fa-solid fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa-solid fa-expand text-white expand-remote-video" title="Expand"></i>`;

      //tạo 1 thẻ div mới cho card 
      let cardDiv = document.createElement("div");
      cardDiv.className = "card card-sm";
      cardDiv.id = `demo-${i}`;
      cardDiv.appendChild(newVid);
      cardDiv.appendChild(controlDiv);

      //đưa thẻ div vào main-section elem
      document.getElementById("videos").appendChild(cardDiv);

      this.adjustVideoElemSize();

      i++;

      if (i == total) {
        clearInterval(testInterval);
      }
    }, 2000);
  },
};

