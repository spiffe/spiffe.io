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

