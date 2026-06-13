/* ArtCOA — usage analytics collector (client-side)
 * ---------------------------------------------------------------------------
 * The site is static (GitHub Pages, no server), so this module:
 *   1. Gathers certificate fields + device info + the visitor's IP/geo
 *      (IP comes from a public lookup API, since a static page can't see it).
 *   2. Sends each event to a backend endpoint you configure (ANALYTICS_ENDPOINT).
 *   3. ALWAYS keeps a local copy in localStorage as a fallback / offline log,
 *      which admin.html reads to show a table + usage count on this device.
 *
 * To get ONE CENTRAL table of ALL users, connect a free Google Sheet backend:
 *   see  backend/apps-script.gs  and paste its Web App URL into ANALYTICS_ENDPOINT.
 *
 * ⚠ Privacy: IP addresses + names are personal data. Tell your users you collect
 *   this (privacy notice) — see the Privacy section in README.md.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────────────
  // Paste your Google Apps Script Web App URL here to enable the central table.
  // Leave '' to log locally only (visible in admin.html on THIS device/browser).
  var ANALYTICS_ENDPOINT = '';

  // Public IP + geo lookup (no API key, CORS-enabled). Swap if you prefer.
  var IP_LOOKUP_URL = 'https://ipwho.is/';

  var LS_EVENTS = 'artcoa_events';   // local event log
  var LS_VID    = 'artcoa_vid';      // anonymous visitor id

  // ── helpers ───────────────────────────────────────────────────────────────
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function lsGet(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  function visitorId() {
    var id = lsGet(LS_VID, '');
    if (!id) { id = uuid(); lsSet(LS_VID, id); }
    return id;
  }

  function deviceInfo() {
    var n = navigator, s = screen || {};
    return {
      userAgent: n.userAgent || '',
      platform:  n.platform || '',
      language:  n.language || '',
      languages: (n.languages || []).join(','),
      vendor:    n.vendor || '',
      cores:     n.hardwareConcurrency || '',
      memoryGB:  n.deviceMemory || '',
      touch:     ('ontouchstart' in global) || (n.maxTouchPoints > 0),
      screen:    (s.width || '') + 'x' + (s.height || ''),
      viewport:  (global.innerWidth || '') + 'x' + (global.innerHeight || ''),
      dpr:       global.devicePixelRatio || 1,
      timezone:  (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } })(),
      referrer:  document.referrer || ''
    };
  }

  function getNetwork() {
    return fetch(IP_LOOKUP_URL)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        return {
          ip:      j.ip || '',
          city:    j.city || '',
          region:  j.region || '',
          country: j.country || '',
          org:     (j.connection && (j.connection.isp || j.connection.org)) || j.org || ''
        };
      })
      .catch(function () { return { ip: '', city: '', region: '', country: '', org: '' }; });
  }

  function saveLocal(ev) {
    var list = [];
    try { list = JSON.parse(lsGet(LS_EVENTS, '[]')); } catch (e) { list = []; }
    list.push(ev);
    if (list.length > 5000) list = list.slice(-5000); // keep the log bounded
    lsSet(LS_EVENTS, JSON.stringify(list));
  }

  function sendRemote(ev) {
    if (!ANALYTICS_ENDPOINT) return Promise.resolve(false);
    // text/plain + no-cors avoids a CORS preflight against Apps Script.
    return fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(ev)
    }).then(function () { return true; }).catch(function () { return false; });
  }

  // ── public API ────────────────────────────────────────────────────────────
  // cert: the object from collect() (keys ar,ti,yr,ty,me,di,ed,ow,ln) + sn (serial)
  // action: 'save' | 'send' | 'visit' | custom
  function track(cert, action) {
    cert = cert || {};
    var base = {
      ts:         new Date().toISOString(),
      action:     action || 'generate',
      visitorId:  visitorId(),
      serial:     cert.sn || '',
      artist:     cert.ar || '',
      title:      cert.ti || '',
      year:       cert.yr || '',
      type:       cert.ty || '',
      medium:     cert.me || '',
      dimensions: cert.di || '',
      edition:    cert.ed || '',
      owner:      cert.ow || '',
      issued:     cert.is || '',
      lang:       cert.ln || '',
      device:     deviceInfo()
    };
    return getNetwork().then(function (net) {
      var ev = Object.assign({}, base, net);
      saveLocal(ev);
      return sendRemote(ev);
    });
  }

  global.ArtCOAAnalytics = {
    track: track,
    all:   function () { try { return JSON.parse(lsGet(LS_EVENTS, '[]')); } catch (e) { return []; } },
    count: function () { return this.all().length; },
    clear: function () { lsSet(LS_EVENTS, '[]'); },
    endpoint: function () { return ANALYTICS_ENDPOINT; }
  };
})(window);
