const title = document.querySelector(".title");
const video_btn = document.querySelector(".video-btn");
const webcam_btn = document.querySelector(".webcam-btn");

video_btn.addEventListener("click", () => {
  window.location.href = "/video";
});

webcam_btn.addEventListener("click", () => {
  window.location.href = "/webcam";
});

title.addEventListener("click", function () {
  window.location.href = "/";
});

