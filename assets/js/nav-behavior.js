(function () {
  function syncActiveLinks(nav) {
    var pathname = window.location.pathname || "/";
    var routeGroups = [
      { match: ["/", "/index.html", "/home-pages/home-v3", "/home-pages/home-v1"], href: "/home-pages/home-v3" },
      { match: ["/about", "/company-pages/about"], href: "/company-pages/about" },
      { match: ["/services", "/services-v1", "/services-pages/services-v1"], href: "/services-pages/services-v1" },
      { match: ["/contact", "/company-pages/contact"], href: "/company-pages/contact" },
      {
        match: [
          "/book-an-appointment",
          "/book-an-appointment-v1",
          "/booking-pages/book-an-appoinment-v1",
          "/booking-pages/book-an-appointment-v1",
        ],
        href: "/booking-pages/book-an-appoinment-v1",
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
