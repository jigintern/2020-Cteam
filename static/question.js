let str = "";
let cnt = 3; // 質問数
$(function () {
  function next(ans, el) {
    el.parents(".question-sub").css("display", "none");
    id = el.attr("href");
    $(id).show("slow");
    str += ans;
    if (str.length === cnt) {
      window.location.href = "./beforeTransition.html"; // 通常の遷移
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
  $(document).on("click", "#a3", function () {
    next("3", $(this));
  });
  $(document).on("click", "#a4", function () {
    next("4", $(this));
  });
});
