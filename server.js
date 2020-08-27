import { listenAndServe } from "https://deno.land/std/http/server.ts";
import { acceptWebSocket, acceptable } from "https://deno.land/std/ws/mod.ts";
import { createApp } from "https://servestjs.org/@v1.1.2/mod.ts";
import { CONTENT_TYPE } from "https://code4sabae.github.io/js/CONTENT_TYPE.js";
import chat from "./chat.js";

listenAndServe({ port: 8883 }, async (req) => {
  if (req.method === "GET" && req.url === "/ws") {
    if (acceptable(req)) {
      acceptWebSocket({
        conn: req.conn,
        bufReader: req.r,
        bufWriter: req.w,
        headers: req.headers,
      }).then(chat);
    }
  }
});

class Server {
  constructor(port) {
    const app = createApp();
    app.handle(/\/*/, async (req) => {
      if (req.path.startsWith("/ws/")) {
        return;
      }
      try {
        const fn = req.path === "/" || req.path.indexOf("..") >= 0
          ? "/index.html"
          : req.path;
        const n = fn.lastIndexOf(".");
        const ext = n < 0 ? "html" : fn.substring(n + 1);
        const data = Deno.readFileSync("static" + fn);
        const ctype = CONTENT_TYPE[ext] || "text/plain";
        await req.respond({
          status: 200,
          headers: new Headers({ "Content-Type": ctype }),
          body: data,
        });
      } catch (e) {
        const errorPage = Deno.readFileSync("./static/error.html");
        req.respond({
          status: 404,
          headers: new Headers({ "Content-Type": "text/html" }),
          body: errorPage,
        });
        if (req.path !== "/favicon.ico") {
          console.log("err", req.path, e.stack);
        }
      }
    });

    app.listen({ port });
    console.log(`http://localhost:${port}/`);
  }
}

new Server(8884);
console.log("↑ここにGo!");
