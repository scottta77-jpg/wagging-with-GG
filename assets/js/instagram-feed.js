(function () {
  'use strict';

  var PROFILE_URL = 'https://www.instagram.com/waggin_with_gg/';
  // 7.2s total cycle: ~2.1s silky fade + staggered wave, followed by ~4.5s of calm stillness
  var CYCLE_INTERVAL_MS = 7200;
  var CARD_STAGGER_MS = 450;
  var FADE_CLEANUP_MS = 2300;
  var SLOT_ORDER = ['tallLeft', 'midTop', 'midBottom', 'tallRight'];

  function resolveUrl(url, prefix) {
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('/') || url.startsWith('data:')) {
      return url;
    }
    return (prefix || '') + url.replace(/^\/+/, '');
  }

  function arrangeSlideFour(four) {
    var hasDims = four.every(function (it) {
      return it && it.width && it.height;
    });
    if (!hasDims) {
      return {
        tallLeft: four[0],
        midTop: four[1],
        midBottom: four[3],
        tallRight: four[2],
      };
    }

    var sorted = four.slice().sort(function (a, b) {
      return a.width / a.height - b.width / b.height;
    });

    return {
      tallLeft: sorted[0],
      tallRight: sorted[1],
      midTop: sorted[2],
      midBottom: sorted[3],
    };
  }

  // Group all Instagram posts into 4-photo sets so every set has 4 distinct photos
  // and adjacent sets (including wrap-around from last -> first) avoid repeating the same photo in a slot
  function buildSets(items) {
    if (!Array.isArray(items) || items.length === 0) return [];

    var total = items.length;
    if (total <= 4) {
      var single = [];
      for (var k = 0; k < 4; k += 1) {
        single.push(items[k % total]);
      }
      return [arrangeSlideFour(single)];
    }

    var numSets = Math.ceil(total / 4);
    var rawGroups = [];

    // Sort helper preferring square/landscape photos when filling remainder slots
    var candidates = items.slice().sort(function (a, b) {
      var ra = a.width && a.height ? a.width / a.height : 1;
      var rb = b.width && b.height ? b.width / b.height : 1;
      return Math.abs(ra - 1) - Math.abs(rb - 1);
    });

    for (var s = 0; s < numSets; s += 1) {
      var group = [];
      var start = s * 4;
      for (var j = 0; j < 4; j += 1) {
        if (start + j < total) {
          group.push(items[start + j]);
        }
      }
      rawGroups.push(group);
    }

    // Fill remainder on final group avoiding items in prev group and first group so every card visibly changes
    var lastGroup = rawGroups[numSets - 1];
    if (lastGroup.length < 4) {
      var prevGroup = numSets > 1 ? rawGroups[numSets - 2] : [];
      var firstGroup = rawGroups[0];

      function isForbidden(cand, strictNeighbors) {
        var inSelf = lastGroup.some(function (g) {
          return g.id === cand.id || g.imageUrl === cand.imageUrl;
        });
        if (inSelf) return true;
        if (!strictNeighbors) return false;
        var inPrev = prevGroup.some(function (g) {
          return g.id === cand.id || g.imageUrl === cand.imageUrl;
        });
        var inFirst = firstGroup.some(function (g) {
          return g.id === cand.id || g.imageUrl === cand.imageUrl;
        });
        return inPrev || inFirst;
      }

      for (var c = 0; c < candidates.length && lastGroup.length < 4; c += 1) {
        if (!isForbidden(candidates[c], true)) {
          lastGroup.push(candidates[c]);
        }
      }
      for (var c2 = 0; c2 < candidates.length && lastGroup.length < 4; c2 += 1) {
        if (!isForbidden(candidates[c2], false)) {
          lastGroup.push(candidates[c2]);
        }
      }
      while (lastGroup.length < 4) {
        lastGroup.push(items[lastGroup.length % total]);
      }
    }

    return rawGroups.map(arrangeSlideFour);
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve();
      var img = new Image();
      var settled = false;
      function done() {
        if (!settled) {
          settled = true;
          resolve();
        }
      }
      img.onload = function () {
        if (typeof img.decode === 'function') {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = done;
      img.src = src;
      setTimeout(done, 2500);
    });
  }

  function crossfadeCard(cardEl, post, prefix) {
    if (!cardEl || !post) return;
    var mediaWrap = cardEl.querySelector('.ig-card-media');
    if (!mediaWrap) return;

    var nextSrc = resolveUrl(post.imageUrl, prefix);
    var currentImg = mediaWrap.querySelector('.ig-card-img.is-current');
    if (currentImg && currentImg.getAttribute('src') === nextSrc) {
      return;
    }

    var rawCaption = post.caption || 'Dog groomed at Waggin with GG';
    var nextAlt = rawCaption.indexOf('Instagram') !== -1
      ? rawCaption
      : rawCaption + ' — View @waggin_with_gg on Instagram';
    var nextHref = post.permalink || PROFILE_URL;

    preloadImage(nextSrc).then(function () {
      // Remove any stale entering layers if a previous transition was interrupted
      var staleEntering = mediaWrap.querySelectorAll('.ig-card-img.is-entering');
      for (var k = 0; k < staleEntering.length; k += 1) {
        if (staleEntering[k].parentNode) {
          staleEntering[k].parentNode.removeChild(staleEntering[k]);
        }
      }

      var enteringImg = document.createElement('img');
      enteringImg.className = 'ig-card-img is-entering';
      enteringImg.src = nextSrc;
      enteringImg.alt = nextAlt;
      enteringImg.decoding = 'async';
      mediaWrap.appendChild(enteringImg);

      // Force reflow so the 2.1s CSS transition runs smoothly from opacity 0 -> 1
      void enteringImg.offsetWidth;
      enteringImg.classList.add('is-visible');

      cardEl.setAttribute('href', nextHref);
      cardEl.setAttribute('aria-label', nextAlt);

      setTimeout(function () {
        var imgs = mediaWrap.querySelectorAll('.ig-card-img');
        for (var m = 0; m < imgs.length; m += 1) {
          if (imgs[m] !== enteringImg && imgs[m].parentNode) {
            imgs[m].parentNode.removeChild(imgs[m]);
          }
        }
        enteringImg.className = 'ig-card-img is-current';
      }, FADE_CLEANUP_MS);
    });
  }

  function createShowcaseController(showcaseEl, initialItems) {
    var prefix = showcaseEl.getAttribute('data-asset-prefix') || '';
    var sets = buildSets(initialItems);
    var setIndex = 0;
    var timer = null;
    var staggerTimers = [];
    var isHovered = false;

    var slotEls = {};
    for (var i = 0; i < SLOT_ORDER.length; i += 1) {
      var key = SLOT_ORDER[i];
      slotEls[key] = showcaseEl.querySelector('[data-ig-slot="' + key + '"]');
    }

    function clearStaggerTimers() {
      while (staggerTimers.length) {
        clearTimeout(staggerTimers.pop());
      }
    }

    function preloadNextSet() {
      if (sets.length <= 1) return;
      var upcoming = sets[(setIndex + 1) % sets.length];
      for (var s = 0; s < SLOT_ORDER.length; s += 1) {
        var post = upcoming[SLOT_ORDER[s]];
        if (post && post.imageUrl) {
          preloadImage(resolveUrl(post.imageUrl, prefix));
        }
      }
    }

    function advanceSet() {
      if (sets.length <= 1 || isHovered || document.hidden) return;
      setIndex = (setIndex + 1) % sets.length;
      var targetSet = sets[setIndex];

      clearStaggerTimers();
      for (var s = 0; s < SLOT_ORDER.length; s += 1) {
        (function (slotName, delayMs) {
          var t = setTimeout(function () {
            crossfadeCard(slotEls[slotName], targetSet[slotName], prefix);
          }, delayMs);
          staggerTimers.push(t);
        })(SLOT_ORDER[s], s * CARD_STAGGER_MS);
      }

      // Warm browser cache for the set after this one
      var preloadTimer = setTimeout(preloadNextSet, 2600);
      staggerTimers.push(preloadTimer);
    }

    function stopLoop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startLoop() {
      stopLoop();
      if (sets.length <= 1 || isHovered || document.hidden) return;
      preloadNextSet();
      timer = setInterval(function () {
        if (!isHovered && !document.hidden) {
          advanceSet();
        }
      }, CYCLE_INTERVAL_MS);
    }

    showcaseEl.addEventListener('mouseenter', function () {
      isHovered = true;
      stopLoop();
    });

    showcaseEl.addEventListener('mouseleave', function () {
      isHovered = false;
      startLoop();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopLoop();
        clearStaggerTimers();
      } else {
        startLoop();
      }
    });

    startLoop();

    return {
      updateItems: function (newItems, source) {
        var newSets = buildSets(newItems);
        if (!newSets.length) return;
        var hadSets = sets.length;
        sets = newSets;
        if (source !== 'cached') {
          setIndex = 0;
          var firstSet = sets[0];
          for (var s = 0; s < SLOT_ORDER.length; s += 1) {
            crossfadeCard(slotEls[SLOT_ORDER[s]], firstSet[SLOT_ORDER[s]], prefix);
          }
        }
        if (hadSets <= 1 && sets.length > 1) {
          startLoop();
        } else {
          preloadNextSet();
        }
      },
    };
  }

  function fetchFeed(prefix) {
    var customUrl = window.WAGGIN_INSTAGRAM_FEED_URL;
    if (customUrl) {
      return fetch(customUrl)
        .then(function (r) {
          if (!r.ok) throw new Error('Feed URL error');
          return r.json();
        })
        .then(function (data) {
          var raw = Array.isArray(data) ? data : data.posts || data.items || [];
          return {
            source: 'client_feed_url',
            items: raw.map(function (p, i) {
              return {
                id: p.id || String(i),
                imageUrl:
                  (p.sizes && p.sizes.large && p.sizes.large.mediaUrl) ||
                  p.thumbnailUrl ||
                  p.mediaUrl ||
                  p.imageUrl,
                permalink: p.permalink || PROFILE_URL,
                caption: p.caption || p.prunedCaption || 'Waggin with GG on Instagram',
                width: p.dimensionsWidth || p.width,
                height: p.dimensionsHeight || p.height,
              };
            }),
          };
        });
    }

    return fetch('/api/instagram', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .catch(function () {
        return fetch((prefix || '') + 'assets/data/instagram-feed.json', {
          headers: { Accept: 'application/json' },
        }).then(function (res) {
          if (!res.ok) throw new Error('Fallback JSON unavailable');
          return res.json();
        });
      });
  }

  function init() {
    var showcases = document.querySelectorAll('[data-instagram-showcase]');
    if (!showcases.length) return;

    var firstPrefix = showcases[0].getAttribute('data-asset-prefix') || '';
    fetchFeed(firstPrefix)
      .then(function (payload) {
        if (!payload || !Array.isArray(payload.items) || !payload.items.length) return;
        for (var i = 0; i < showcases.length; i += 1) {
          var ctrl = createShowcaseController(showcases[i], payload.items);
          if (payload.source !== 'cached') {
            ctrl.updateItems(payload.items, payload.source);
          }
        }
      })
      .catch(function () {
        // Pre-rendered 4-card bento showcase remains cleanly displayed
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
