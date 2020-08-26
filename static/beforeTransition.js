$(document).on("click", ".submitButton", function () {
  let name = $(".name").val();
  let roomId = sessionStorage.getItem("roomId");
  let url = `./chat.html?name=${name}&group=${roomId}`;
  window.location.href = url;
});

$(() => $(".roomName").text("Room" + sessionStorage.getItem("roomId")));
