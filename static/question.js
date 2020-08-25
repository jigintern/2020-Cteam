let str = "";
let cnt = 3; // 質問数
$(function () {
  function next(ans, el) {
    el.parents(".question-sub").css("display", "none");
    id = el.attr("href");
    $(id).show("slow");
    str += ans;
    if (str.length === cnt) {
      sessionStorage.setItem("roomId", str);
      window.location.href = "./beforeTransition.html";
      window.open("./beforeTransition.html");
    }
    console.log(str);
  }

  $(document).on("click", "#a1", function () {
    next("1", $(this));
  });
  $(document).on("click", "#a2", function () {
    next("2", $(this));
  });
});
