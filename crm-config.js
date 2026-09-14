/* Live CRM proxy — public bot posts claim/policy lookups here.
   Quick tunnels change whenever cloudflared restarts — refresh this URL from PUBLIC-URL.txt
   or http://127.0.0.1:20241/quicktunnel on the PC (append /claim).
   FortiClient VPN + local CRM gateway (8787) + serve-all (5500) required.
   Agents can also paste/save a URL in Manager Hub (localStorage wins). */
window.METHAQ_CRM_GATEWAY = "https://wallpapers-cover-nov-sellers.trycloudflare.com/claim";
