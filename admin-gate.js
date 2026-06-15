/* ArtCOA — client-side passphrase gate for the admin pages (admin.html, admin-keys.html).
 *
 * IMPORTANT: this is a DETERRENT, not server-grade security. A static site (GitHub Pages) has no
 * server, so this only blocks the UI; a technical user could read the source. It keeps casual /
 * unwanted visitors out. The REAL control over what is trusted is GitHub repo (deploy) access.
 * For true protection, host the admin pages behind real auth (e.g. Cloudflare Access).
 *
 * The passphrase is stored only as its SHA-256 hash below — change it via the "Set / change
 * passphrase" link on the gate, paste the new hash here, and deploy.
 */
window.ADMIN_PASS_HASH = 'ccc0b903bce51fb554262d742d0a282e1f8a87d064f1cf44f8ff5148ca4beb42'; // default: "change-me-now"

(function(){
  var SS = 'artcoa_admin_ok';
  function sha256hex(s){
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(b){
      return [].map.call(new Uint8Array(b), function(x){ return x.toString(16).padStart(2,'0'); }).join('');
    });
  }
  if(sessionStorage.getItem(SS) === '1') return;          // already unlocked this session

  function gate(){
    var ov = document.createElement('div');
    ov.id = 'admin-gate';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fbfaf7;display:flex;'
      + 'align-items:center;justify-content:center;font-family:-apple-system,Segoe UI,Roboto,sans-serif';
    ov.innerHTML =
      '<div style="max-width:360px;width:90%;text-align:center">'
      + '<div style="font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#7c2d2d">◇ ArtCOA admin</div>'
      + '<h2 style="font-weight:600;margin:10px 0 16px;color:#1a1714">Restricted area</h2>'
      + '<input id="ag-pass" type="password" placeholder="Passphrase" autocomplete="current-password" '
      + 'style="width:100%;font-size:15px;padding:11px 13px;border:1px solid #d8d3c9;border-radius:6px">'
      + '<button id="ag-ok" style="margin-top:12px;width:100%;font-size:14px;padding:11px;background:#1a1714;'
      + 'color:#fff;border:none;border-radius:6px;cursor:pointer">Unlock</button>'
      + '<div id="ag-err" style="color:#7c2d2d;font-size:13px;margin-top:10px;min-height:18px"></div>'
      + '<div style="margin-top:18px;font-size:12px"><a id="ag-set" href="#" style="color:#6b645b">Set / change passphrase</a></div>'
      + '</div>';
    document.body.appendChild(ov);

    function tryUnlock(){
      sha256hex(document.getElementById('ag-pass').value).then(function(h){
        if(h === window.ADMIN_PASS_HASH){ sessionStorage.setItem(SS, '1'); location.reload(); }
        else { document.getElementById('ag-err').textContent = 'Wrong passphrase.'; }
      });
    }
    document.getElementById('ag-ok').onclick = tryUnlock;
    document.getElementById('ag-pass').addEventListener('keydown', function(e){ if(e.key === 'Enter') tryUnlock(); });
    document.getElementById('ag-pass').focus();
    document.getElementById('ag-set').onclick = function(e){
      e.preventDefault();
      var p = prompt('New passphrase:');
      if(!p) return;
      sha256hex(p).then(function(h){
        prompt('Put this hash into admin-gate.js as window.ADMIN_PASS_HASH, then deploy:', h);
      });
    };
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gate);
  else gate();
})();
