/*
 * SmoothSales lead capture. Add once per page, before </body>:
 *   <script src="https://YOUR-CRM/lead-capture.js" data-endpoint="YOUR-WEBHOOK-URL" defer></script>
 * Sends every form marked with data-smoothsales, plus the visit's UTM tags and ad click ids.
 * Events on the form: "smoothsales:success" and "smoothsales:error".
 */
(function () {
  "use strict";
  var script = document.currentScript;
  var endpoint = script && script.getAttribute("data-endpoint");
  if (!endpoint) { console.error("[SmoothSales] data-endpoint is missing"); return; }

  var KEY = "smoothsales_visit";
  var TAGS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid"];

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function cookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  // Remember the last ad click for 90 days, because people often fill the form on another page.
  var query = new URLSearchParams(location.search);
  var visit = read();
  if (TAGS.some(function (t) { return query.get(t); })) {
    visit = { at: Date.now(), landing_page: location.href, referrer: document.referrer };
    TAGS.forEach(function (t) { if (query.get(t)) visit[t] = query.get(t); });
    try { localStorage.setItem(KEY, JSON.stringify(visit)); } catch (e) { /* private mode */ }
  } else if (!visit.at || Date.now() - visit.at > 90 * 864e5) {
    visit = {};
  }

  function payload(form) {
    var out = {};
    new FormData(form).forEach(function (value, name) {
      if (typeof value !== "string") return; // files are not sent
      out[name] = out[name] ? out[name] + ", " + value : value;
    });
    TAGS.forEach(function (t) { if (visit[t] && !out[t]) out[t] = visit[t]; });
    out.landing_page = out.landing_page || visit.landing_page || location.href;
    out.referrer = out.referrer || visit.referrer || document.referrer;
    if (cookie("_fbp")) out._fbp = cookie("_fbp");
    if (cookie("_fbc")) out._fbc = cookie("_fbc");
    return out;
  }

  function fire(form, name, detail) {
    form.dispatchEvent(new CustomEvent("smoothsales:" + name, { bubbles: true, detail: detail }));
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches || !form.matches("form[data-smoothsales]")) return;
    event.preventDefault();
    if (form.getAttribute("data-smoothsales-busy")) return;
    form.setAttribute("data-smoothsales-busy", "1");
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(form)),
      keepalive: true
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      fire(form, "success");
      var next = form.getAttribute("data-redirect");
      if (next) { location.href = next; return; }
      form.reset();
      var thanks = form.querySelector("[data-smoothsales-thanks]");
      if (thanks) thanks.hidden = false;
    }).catch(function (err) {
      console.error("[SmoothSales] lead not sent", err);
      fire(form, "error", { message: err.message });
      var failed = form.querySelector("[data-smoothsales-error]");
      if (failed) failed.hidden = false;
    }).finally(function () {
      form.removeAttribute("data-smoothsales-busy");
    });
  });
})();
