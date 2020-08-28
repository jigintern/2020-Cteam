$(document).on("click", ".submitButton", function () {
  let name = $(".name").val();
  if (name.length === 0) {
    alert("1文字以上入力してください");
  } else if (name.length > 10) {
    alert("10文字以下で入力してください");
  } else if (name.length !== name.replace(/\s+/g, "").length) {
    alert("空白文字は使わないでください");
  } else {
    let roomId = sessionStorage.getItem("roomId");
    let url = `./chat.html?name=${name}&group=${roomId}`;
    window.location.href = url;
  }
});

$(() => $(".roomName").text(sessionStorage.getItem("roomId")));
