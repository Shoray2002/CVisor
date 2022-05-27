const title = document.querySelector(".title");
const video_btn = document.querySelector(".video-btn");
const stream_btn = document.querySelector(".stream-btn");

video_btn.addEventListener("click", () => {
  window.location.href = "/video";
});

stream_btn.addEventListener("click", () => {
  window.location.href = "/stream";
});

title.addEventListener("click", function () {
  window.location.href = "/";
});

