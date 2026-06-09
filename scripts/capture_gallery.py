#!/usr/bin/env python3
"""Render every sketch in artworks/ to a clean gallery thumbnail.

Each sketch is loaded in a throwaway capture page, any HTML control panels are
hidden, the exact canvas rectangle is read, and a clipped screenshot is taken
straight from the live p5.js / three.js output. Thumbnails are written to
assets/gallery/<id>.webp and used by the README gallery.

This talks to a headless Chrome over the DevTools Protocol with a small,
dependency-free WebSocket client (so it needs no pip packages).

Usage
-----
1. Start the dev server (serves /artworks and image assets at the root):
       npm run dev                      # note the port, e.g. 3000

2. Start a headless Chrome with remote debugging on port 9222, e.g.:
       chrome --headless=new --remote-debugging-port=9222 \
              --use-angle=swiftshader --enable-unsafe-swiftshader \
              --window-size=1300,1300 about:blank

3. Run this script with the dev-server port:
       python3 scripts/capture_gallery.py --port 3000

   Capture a subset:
       python3 scripts/capture_gallery.py --port 3000 --ids p63,p66,p68
"""
import os, sys, json, socket, base64, struct, time, io, argparse, glob, re

try:
    from PIL import Image
except ImportError:
    sys.exit("This script needs Pillow:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "gallery")
CAPTURE_PAGE = os.path.join(ROOT, "public", "_capture.html")
P5_VER = "1.7.0"
DEBUG_PORT = 9222
MAX_THUMB = 640  # longest side, never upscaled


# --------------------------------------------------------------- square padding
# Gallery cells must all be the SAME square size so the README grid stays even.
# A sketch's drawing pane can be any aspect ratio; we letterbox the capture into
# a square, filling the margin with the piece's OWN background — the median color
# of its border ring — so the filler blends in instead of reading as a frame.
def border_fill(im, frac=0.02):
    im = im.convert("RGB")
    w, h = im.size
    b = max(2, round(frac * min(w, h)))
    strips = (im.crop((0, 0, w, b)), im.crop((0, h - b, w, h)),
              im.crop((0, 0, b, h)), im.crop((w - b, 0, w, h)))
    data = b"".join(s.tobytes() for s in strips)  # interleaved RGB bytes
    return tuple(sorted(data[c::3])[len(data) // 6] for c in range(3))  # per-channel median


def pad_square(im):
    im = im.convert("RGB"); w, h = im.size
    if w == h:
        return im
    S = max(w, h)
    canvas = Image.new("RGB", (S, S), border_fill(im))
    canvas.paste(im, ((S - w) // 2, (S - h) // 2))
    return canvas


def square_existing():
    """Pad every already-captured thumbnail to a square in place (no Chrome)."""
    files = sorted(glob.glob(os.path.join(OUT_DIR, "p*.webp")),
                   key=lambda f: int(re.search(r"\d+", os.path.basename(f)).group()))
    n = 0
    for f in files:
        im = Image.open(f).convert("RGB")
        if im.width == im.height:
            continue
        S = max(im.size)
        pad_square(im).save(f, "WEBP", quality=82, method=6)
        n += 1; print(f"  squared {os.path.basename(f)} {im.size[0]}x{im.size[1]} -> {S}x{S}")
    print(f"squared {n} thumbnail(s) -> {OUT_DIR}")

CAPTURE_HTML = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>capture</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/{P5_VER}/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/{P5_VER}/addons/p5.sound.min.js"></script>
<style>html,body{{margin:0;padding:0;background:#fff}}body{{padding:12px}}canvas{{display:block!important}}</style>
</head><body><script>
const art=new URLSearchParams(location.search).get('art');
if(art){{const s=document.createElement('script');s.src='/artworks/'+art+'?t='+Date.now();document.head.appendChild(s);}}
// Keep only the largest canvas + its ancestors visible; hide control panels.
function clean(){{
  const cs=[].slice.call(document.querySelectorAll('canvas'));
  if(!cs.length)return; cs.sort((a,b)=>b.width*b.height-a.width*a.height);
  let node=cs[0];
  while(node&&node!==document.body&&node.parentNode){{
    const p=node.parentNode;
    [].slice.call(p.children).forEach(ch=>{{if(ch!==node&&ch.tagName!=='SCRIPT')ch.style.display='none';}});
    if(node!==cs[0]){{node.style.background='transparent';node.style.border='none';
      node.style.boxShadow='none';node.style.padding='0';node.style.margin='0';}}
    node=p;
  }}
}}
setInterval(clean,150);
</script></body></html>
"""


# ---------------------------------------------------------------- minimal WS / CDP
class WS:
    def __init__(self, host, port, path):
        self.s = socket.create_connection((host, port), timeout=30); self.s.settimeout(40)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\n"
                        f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
                        "Sec-WebSocket-Version: 13\r\n\r\n").encode())
        b = b""
        while b"\r\n\r\n" not in b:
            b += self.s.recv(4096)
        self.buf = b.split(b"\r\n\r\n", 1)[1]

    def _recv(self, n):
        while len(self.buf) < n:
            c = self.s.recv(65536)
            if not c:
                raise ConnectionError("socket closed")
            self.buf += c
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, obj):
        d = json.dumps(obj).encode(); h = bytearray([0x81]); n = len(d); m = os.urandom(4)
        if n < 126:
            h.append(0x80 | n)
        elif n < 65536:
            h.append(0x80 | 126); h += struct.pack(">H", n)
        else:
            h.append(0x80 | 127); h += struct.pack(">Q", n)
        h += m
        self.s.sendall(bytes(h) + bytes(b ^ m[i % 4] for i, b in enumerate(d)))

    def recv(self):
        p = b""
        while True:
            b0, b1 = self._recv(2); fin = b0 & 0x80; op = b0 & 0x0F; ln = b1 & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", self._recv(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", self._recv(8))[0]
            d = self._recv(ln) if ln else b""
            if op == 0x9:
                continue
            if op == 0x8:
                raise ConnectionError("ws close")
            p += d
            if fin:
                break
        return json.loads(p.decode("utf-8", "replace"))


def http_get(host, port, path):
    s = socket.create_connection((host, port), timeout=10)
    s.sendall(f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nConnection: close\r\n\r\n".encode())
    d = b""
    while b"\r\n\r\n" not in d:
        d += s.recv(65536)
    head, _, body = d.partition(b"\r\n\r\n"); clen = 0
    for line in head.split(b"\r\n"):
        if line.lower().startswith(b"content-length:"):
            clen = int(line.split(b":")[1])
    while len(body) < clen:
        body += s.recv(65536)
    return json.loads(body)


class CDP:
    def __init__(self, ws):
        self.ws = ws; self.id = 0

    def cmd(self, method, params=None, sid=None):
        self.id += 1; mid = self.id
        msg = {"id": mid, "method": method, "params": params or {}}
        if sid:
            msg["sessionId"] = sid
        self.ws.send(msg)
        while True:
            m = self.ws.recv()
            if m.get("id") == mid:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})


RECT_JS = """(function(){var cs=[].slice.call(document.querySelectorAll('canvas'));
if(!cs.length)return null;cs.sort((a,b)=>b.width*b.height-a.width*a.height);
var r=cs[0].getBoundingClientRect();
return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height});})()"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", help="dev-server port (npm run dev); required unless --square-existing")
    ap.add_argument("--debug-port", type=int, default=DEBUG_PORT, help="Chrome remote-debugging port")
    ap.add_argument("--ids", default="", help="comma list of ids to capture (default: all)")
    ap.add_argument("--square-existing", action="store_true",
                    help="pad already-captured thumbnails to square in place (no Chrome needed) and exit")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    if args.square_existing:
        square_existing(); return
    if not args.port:
        ap.error("--port is required (the npm run dev port) unless --square-existing")
    if args.ids:
        ids = [s if s.endswith(".js") else s + ".js" for s in args.ids.split(",")]
    else:
        files = glob.glob(os.path.join(ROOT, "artworks", "p*.js"))
        ids = sorted((os.path.basename(f) for f in files if re.match(r"p\d+\.js$", os.path.basename(f))),
                     key=lambda f: int(re.search(r"\d+", f).group()))

    # write the throwaway capture page, remove it on exit
    with open(CAPTURE_PAGE, "w") as fh:
        fh.write(CAPTURE_HTML)
    try:
        ver = http_get("localhost", args.debug_port, "/json/version")
        wsurl = ver["webSocketDebuggerUrl"]
        bws = wsurl[wsurl.index("/devtools"):]  # path part, host-agnostic
        cdp = CDP(WS("localhost", args.debug_port, bws))
        tgt = cdp.cmd("Target.createTarget", {"url": "about:blank"})["targetId"]
        sid = cdp.cmd("Target.attachToTarget", {"targetId": tgt, "flatten": True})["sessionId"]
        cdp.cmd("Page.enable", {}, sid)
        cdp.cmd("Runtime.enable", {}, sid)

        ok = 0
        for art in ids:
            aid = art[:-3]
            try:
                cdp.cmd("Page.navigate", {"url": f"http://localhost:{args.port}/_capture.html?art={art}"}, sid)
                rect, deadline = None, time.time() + 18
                while time.time() < deadline:
                    time.sleep(0.4)
                    v = cdp.cmd("Runtime.evaluate", {"expression": RECT_JS, "returnByValue": True}, sid)
                    val = v.get("result", {}).get("value")
                    if val:
                        rect = json.loads(val)
                        if rect["w"] > 2 and rect["h"] > 2:
                            break
                if not rect:
                    print(f"  {aid}: NO CANVAS"); continue
                time.sleep(1.2)
                clip = {"x": rect["x"], "y": rect["y"], "width": rect["w"], "height": rect["h"], "scale": 1}
                shot = cdp.cmd("Page.captureScreenshot",
                               {"format": "png", "clip": clip, "captureBeyondViewport": True}, sid)
                im = Image.open(io.BytesIO(base64.b64decode(shot["data"]))).convert("RGB")
                w, h = im.size
                scale = min(1.0, MAX_THUMB / max(w, h))
                if scale < 1:
                    im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
                im = pad_square(im)  # letterbox to a uniform square gallery cell
                im.save(os.path.join(OUT_DIR, f"{aid}.webp"), "WEBP", quality=82, method=6)
                ok += 1
                print(f"  {aid}: {w}x{h}")
            except Exception as e:
                print(f"  {aid}: ERROR {e}")
        cdp.cmd("Target.closeTarget", {"targetId": tgt})
        print(f"\ncaptured {ok}/{len(ids)} -> {OUT_DIR}")
    finally:
        if os.path.exists(CAPTURE_PAGE):
            os.remove(CAPTURE_PAGE)


if __name__ == "__main__":
    main()
