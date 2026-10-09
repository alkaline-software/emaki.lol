/**
 * Navbar widgets: dark-mode toggle, keyboard-shortcuts button, GitHub
 * stars/forks dropdown, and search, gathered into one tray (#navbar-widgets).
 * Plain Quarto site; ported in spirit from Great Docs' navbar widgets.
 */
(function () {
  "use strict";

  var ICON_KEYBOARD =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg>';
  var ICON_CLOSE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var ICON_GITHUB =
    '<svg class="gh-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  var ICON_STAR =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
  var ICON_FORK =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>';
  var ICON_ARROW =
    '<svg class="gh-dropdown-arrow" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"/></svg>';
  var ICON_ISSUE =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>';
  var ICON_PR =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>';
  var ICON_REPO =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>';

  function esc(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  // ── GitHub widget ──────────────────────────────────────────────────

  var CACHE_MS = 4 * 60 * 60 * 1000;

  function cacheGet(key, allowStale) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!allowStale && Date.now() - parsed.timestamp > CACHE_MS) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function formatCount(n) {
    if (n === undefined || n === null || n === "?") return "?";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function initGitHub(widget) {
    var owner = widget.dataset.owner;
    var repo = widget.dataset.repo;
    if (!owner || !repo) return;
    var url = "https://github.com/" + owner + "/" + repo;

    function item(href, icon, label, badge) {
      return (
        '<a href="' + href + '" class="gh-dropdown-item" role="menuitem" target="_blank" rel="noopener">' +
        icon + label +
        (badge ? '<span class="gh-badge ' + badge + '" style="display:none"></span>' : "") +
        "</a>"
      );
    }

    widget.innerHTML =
      '<div class="gh-widget-trigger" role="button" aria-haspopup="true" aria-expanded="false" tabindex="0">' +
      ICON_GITHUB +
      '<span class="gh-stats">' +
      '<span class="gh-stat" title="Stars">' + ICON_STAR + '<span class="gh-count" data-stat="stars">-</span></span>' +
      '<span class="gh-stat" title="Forks">' + ICON_FORK + '<span class="gh-count" data-stat="forks">-</span></span>' +
      "</span>" + ICON_ARROW + "</div>" +
      '<div class="gh-dropdown" role="menu" aria-hidden="true">' +
      item(url, ICON_REPO, "Repository") +
      item(url + "/issues", ICON_ISSUE, "Issues") +
      item(url + "/pulls", ICON_PR, "Pull Requests") +
      '<div class="gh-dropdown-divider"></div>' +
      item(url, ICON_STAR, "Add a Star", "gh-stars-total") +
      item(url + "/fork", ICON_FORK, "Create a Fork", "gh-forks-total") +
      "</div>";

    function show(stats) {
      var map = {
        '.gh-count[data-stat="stars"]': stats.stars,
        '.gh-count[data-stat="forks"]': stats.forks,
      };
      Object.keys(map).forEach(function (sel) {
        var el = widget.querySelector(sel);
        if (el) el.textContent = formatCount(map[sel]);
      });
      [[".gh-stars-total", stats.stars], [".gh-forks-total", stats.forks]].forEach(function (p) {
        var el = widget.querySelector(p[0]);
        if (el && p[1] !== undefined && p[1] !== "?") {
          el.textContent = formatCount(p[1]);
          el.style.display = "inline-flex";
        }
      });
    }

    var key = "emaki-github-stats-" + owner + "-" + repo;
    var fresh = cacheGet(key, false);
    if (fresh) {
      show(fresh);
    } else {
      var stale = cacheGet(key, true);
      fetch("https://api.github.com/repos/" + owner + "/" + repo, {
        headers: { Accept: "application/vnd.github+json" },
      })
        .then(function (r) {
          if (!r.ok) throw new Error("GitHub API " + r.status);
          return r.json();
        })
        .then(function (d) {
          var stats = { stars: d.stargazers_count, forks: d.forks_count, timestamp: Date.now() };
          cacheSet(key, stats);
          show(stats);
        })
        .catch(function () {
          show(stale || { stars: "?", forks: "?" });
        });
    }

    var trigger = widget.querySelector(".gh-widget-trigger");
    var dropdown = widget.querySelector(".gh-dropdown");

    function setOpen(open) {
      trigger.setAttribute("aria-expanded", String(open));
      dropdown.setAttribute("aria-hidden", String(!open));
      widget.classList.toggle("gh-widget-open", open);
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click();
      }
    });
    document.addEventListener("click", function (e) {
      if (!widget.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────

  var GROUPS = [
    {
      title: "Navigation",
      rows: [
        { keys: ["s", "/"], desc: "Focus search", sep: "or" },
        { keys: ["[", "]"], desc: "Previous / next page", sep: "/" },
        { keys: ["q"], desc: "Go to homepage" },
      ],
    },
    { title: "Display", rows: [{ keys: ["d"], desc: "Toggle dark mode" }] },
    {
      title: "General",
      rows: [
        { keys: ["h", "?"], desc: "Show keyboard shortcuts", sep: "or" },
        { keys: ["Esc"], desc: "Close / dismiss" },
      ],
    },
  ];

  var overlay = null;
  var overlayOpen = false;

  function buildOverlay() {
    var el = document.createElement("div");
    el.className = "kb-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Keyboard shortcuts");

    var html =
      '<div class="kb-overlay-inner"><div class="kb-overlay-header"><h2>Keyboard shortcuts</h2>' +
      '<button class="kb-overlay-close" type="button" aria-label="Close">' + ICON_CLOSE + "</button></div>" +
      '<div class="kb-overlay-body">';
    GROUPS.forEach(function (g) {
      html += '<div class="kb-group"><h3>' + esc(g.title) + "</h3><dl>";
      g.rows.forEach(function (r) {
        var sep = r.sep === "or" ? ' <span class="kb-or">or</span> ' : " " + (r.sep || "") + " ";
        html += '<div class="kb-row"><dt>' +
          r.keys.map(function (k) { return "<kbd>" + esc(k) + "</kbd>"; }).join(sep) +
          "</dt><dd>" + esc(r.desc) + "</dd></div>";
      });
      html += "</dl></div>";
    });
    html += "</div></div>";
    el.innerHTML = html;
    return el;
  }

  function showOverlay() {
    if (!overlay) {
      overlay = buildOverlay();
      document.body.appendChild(overlay);
      overlay.querySelector(".kb-overlay-close").addEventListener("click", hideOverlay);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) hideOverlay();
      });
    }
    void overlay.offsetWidth;
    overlay.classList.add("kb-overlay-visible");
    overlayOpen = true;
    overlay.querySelector(".kb-overlay-close").focus();
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove("kb-overlay-visible");
    overlayOpen = false;
  }

  function isTyping() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function focusSearch() {
    var input = document.querySelector("#quarto-search input, .aa-Input");
    if (input) {
      input.focus();
      return;
    }
    var btn = document.querySelector("#quarto-search .aa-DetachedSearchButton, #quarto-search button");
    if (btn) btn.click();
  }

  function go(selector) {
    var a = document.querySelector(selector);
    if (a && a.href) window.location.href = a.href;
  }

  function onKeydown(e) {
    if (overlayOpen) {
      if (e.key === "Escape" || e.key === "h" || e.key === "?") {
        e.preventDefault();
        hideOverlay();
      }
      return;
    }
    if (isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case "?":
      case "h":
        e.preventDefault();
        showOverlay();
        break;
      case "s":
      case "/":
        e.preventDefault();
        focusSearch();
        break;
      case "[":
        e.preventDefault();
        go(".nav-page-previous a, a.pagination-link[rel=prev], .nav-page.nav-page-previous a");
        break;
      case "]":
        e.preventDefault();
        go(".nav-page-next a, a.pagination-link[rel=next], .nav-page.nav-page-next a");
        break;
      case "q":
        e.preventDefault();
        go(".navbar-brand, .navbar-title");
        break;
      case "d":
        e.preventDefault();
        var toggle = document.querySelector(".quarto-color-scheme-toggle");
        if (toggle) toggle.click();
        break;
      case "Escape":
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        break;
    }
  }

  function makeKeyboardButton() {
    var btn = document.createElement("button");
    btn.id = "kb-btn";
    btn.className = "kb-btn";
    btn.type = "button";
    btn.title = "Keyboard shortcuts (?)";
    btn.setAttribute("aria-label", "Show keyboard shortcuts");
    btn.innerHTML = ICON_KEYBOARD;
    btn.addEventListener("click", function () {
      if (overlayOpen) hideOverlay();
      else showOverlay();
    });
    return btn;
  }

  // ── Tray ───────────────────────────────────────────────────────────

  function collect() {
    var container = document.querySelector(".navbar .container-fluid");
    if (!container) return;

    var tray = document.getElementById("navbar-widgets");
    if (!tray) {
      tray = document.createElement("div");
      tray.id = "navbar-widgets";
      var tools = container.querySelector(".quarto-navbar-tools");
      (tools || container).appendChild(tray);
    }

    function move(el, unwrapLi) {
      if (!el || tray.contains(el)) return;
      var li = unwrapLi ? el.closest("li.nav-item") : null;
      tray.appendChild(el);
      if (li && !li.children.length) li.remove();
    }

    // Order: dark toggle, keyboard, GitHub, search.
    move(document.querySelector(".quarto-color-scheme-toggle"), true);
    var kb = document.getElementById("kb-btn");
    if (!kb) kb = makeKeyboardButton();
    move(kb, false);
    move(document.getElementById("github-widget"), true);
    move(document.getElementById("quarto-search"), false);
  }

  function init() {
    var widget = document.getElementById("github-widget");
    if (!widget) {
      // Replace the plain navbar GitHub link with the widget.
      var link = document.querySelector('.navbar a.nav-link[href*="github.com/"]');
      var m = link && link.href.match(/github\.com\/([^/]+)\/([^/#?]+)/);
      if (m) {
        widget = document.createElement("div");
        widget.id = "github-widget";
        widget.dataset.owner = m[1];
        widget.dataset.repo = m[2];
        var li = link.closest("li.nav-item");
        (li || link).replaceWith(widget);
      }
    }
    if (widget && !widget.dataset.ready) {
      widget.dataset.ready = "1";
      initGitHub(widget);
    }
    collect();
    document.addEventListener("keydown", onKeydown);

    // Quarto injects the toggle/search after load; re-collect briefly.
    var scheduled = false;
    var navbar = document.querySelector(".navbar");
    if (navbar) {
      new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          collect();
        });
      }).observe(navbar, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
