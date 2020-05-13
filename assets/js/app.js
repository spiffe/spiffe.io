const tippyConfig = {
  trigger: "click",
  content: "Copied link to clipboard",
  size: "large",
  duration: 500,
};

const anchorJsOptions = {
  icon: "#",
};

const anchorJsSelector = ".article h2, .article h3, .article h4";

function addAnchorTags() {
  anchors.options = anchorJsOptions;
  anchors.add(anchorJsSelector);
}

function navbarBurgerToggle() {
  const burger = $(".navbar-burger"),
    menu = $(".navbar-menu");

  burger.click(function () {
    [burger, menu].forEach(function (el) {
      el.toggleClass("is-active");
    });
  });
}

function clipboard() {
  new ClipboardJS(".is-clipboard");

  tippy(".is-clipboard", tippyConfig);
}

function linkClickOffset() {
  const navbarHeight = $(".navbar").height();
  const extraPadding = 20;
  const navbarOffset = -1 * (navbarHeight + extraPadding);
  var shiftWindow = function () {
    scrollBy(0, navbarOffset);
  };
  window.addEventListener("hashchange", shiftWindow);
  window.addEventListener("pageshow", shiftWindow);
  function load() {
    if (window.location.hash) shiftWindow();
  }
}

$(function () {
  navbarBurgerToggle();
  clipboard();
  addAnchorTags();
  linkClickOffset();
});

document.addEventListener("DOMContentLoaded", function (event) {
  anchors.add();

  // TODO: We should probably look into updating the tocbot library
  // but for now we can pad the bottom of the content to make
  // sure you can scroll into each section of the ToC.
  var content = $(".content");
  var lastHeading = content
    .children()
    .filter(":header")
    .sort(function (a, b) {
      var aTop = a.offsetTop;
      var bTop = b.offsetTop;
      return aTop < bTop ? -1 : aTop > bTop ? 1 : 0;
    })
    .last()
    .get(0);
  var fullHeight = content.outerHeight(true) + content.offset().top;
  var delta = fullHeight - lastHeading.offsetTop;
  var padding = window.innerHeight - delta;
  content.css("paddingBottom", padding + "px");

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
