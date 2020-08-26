let str = "";
let cnt = 3; // 質問数
$(function () {
  function next(ans, el) {
    el.parents(".question-sub").css("display", "none");
    id = el.attr("href");
    $(id).show("slow");
    str += ans;
    if (str.length === cnt) {
      const ch = new Array(
        "111",
        "112",
        "121",
        "122",
        "211",
        "212",
        "221",
        "222",
      );
      const roomId = new Array(
        "一緒に出かけたい芸能人",
        "行ってよかった場所",
        "スポーツ",
        "行ってみたい場所",
        "スマホゲー",
        "Youtube",
        "映画",
        "音楽",
      );

      for (let i = 0; i < 8; ++i) {
        if (ch[i] === str) {
          sessionStorage.setItem("roomId", roomId[i]);
          window.location.href = "./beforeTransition.html";
        }
      }
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
