document.addEventListener("DOMContentLoaded", function (event) {
    anchors.add();

    tocbot.init({
      tocSelector: ".toc",
      contentSelector: ".content",
      headingSelector: "h1, h2, h3, h4, h5",
      scrollSmooth: false,
      scrollContainer: ".dashboard-main",
      scrollEndCallback: function (e) {
        // Make sure the current ToC item we are on is visible in the nav bar
        $(".docs-nav-item.is-active")[0].scrollIntoView();
      },
    });
  });