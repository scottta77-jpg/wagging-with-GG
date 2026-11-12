(function () {
  function syncActiveLinks(nav) {
    var pathname = window.location.pathname || "/";
    var routeGroups = [
      { match: ["/", "/home", "/index.html", "/home.html"], href: "/home" },
      { match: ["/about", "/about.html"], href: "/about" },
      { match: ["/services", "/services.html"], href: "/services" },
      { match: ["/contact", "/contact.html"], href: "/contact" },
      {
        match: [
          "/book-an-appoinment",
          "/book-an-appoinment.html",
          "/book-an-appointment",
          "/book-an-appointment.html",
        ],
        href: "/book-an-appoinment",
      },
    ];

    var cleanPath = pathname.replace(/\/+$/, "") || "/";
    var activeHref = null;
    for (var i = 0; i < routeGroups.length; i++) {
      if (routeGroups[i].match.indexOf(cleanPath) !== -1) {
        activeHref = routeGroups[i].href;
        break;
      }
    }

    var navLinks = nav.querySelectorAll(".link-nav-item .link[href]");
    for (var j = 0; j < navLinks.length; j++) {
      var link = navLinks[j];
      var href = link.getAttribute("href") || "";
      var isCurrent = activeHref && href === activeHref;
      link.classList.toggle("active", !!isCurrent);
      link.classList.toggle("w--current", !!isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function initNavBehavior() {
    var nav = document.querySelector(".header-wrapper");
    if (!nav) return;

    syncActiveLinks(nav);
    window.addEventListener("load", function () {
      syncActiveLinks(nav);
    });

    var hero = document.querySelector(".section.hero-v9");
    var isHomePage = !!hero;

    function updateNav() {
      var scrollY = window.scrollY || window.pageYOffset || 0;
      var compactThreshold = 10;

      if (scrollY > compactThreshold) {
        nav.classList.add("compact");
      } else {
        nav.classList.remove("compact");
      }

      if (!isHomePage) {
        if (scrollY <= compactThreshold) {
          nav.classList.remove("scrolled");
          nav.classList.add("hero-active");
        } else {
          nav.classList.remove("hero-active");
          nav.classList.add("scrolled");
        }
      } else {
        nav.classList.remove("hero-active");
        var navHeight = nav.offsetHeight || 76;
        var heroBottom = hero.getBoundingClientRect().bottom + scrollY - navHeight;
        var scrollThreshold = Math.max(compactThreshold, heroBottom);
        if (scrollY > scrollThreshold) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }
      }
    }

    window.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav, { passive: true });
    updateNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavBehavior);
  } else {
    initNavBehavior();
  }
})();
