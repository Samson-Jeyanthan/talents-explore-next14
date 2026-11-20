// Local browser checks via an isolated Chrome started with --remote-debugging-port=9224.
// Pass JavaScript in TE_BROWSER_EXPRESSION; never persist credentials in this file.
const fs = require("node:fs");
(async () => {
  const pages = await (await fetch("http://localhost:9224/json/list")).json();
  const page = pages.find(
    (p) =>
      p.type === "page" &&
      p.url.startsWith(
        process.env.TE_BROWSER_ORIGIN || "http://localhost:3000",
      ) &&
      (!process.env.TE_BROWSER_PAGE_ID ||
        p.id === process.env.TE_BROWSER_PAGE_ID),
  );
  if (!page) throw new Error("Local app browser tab not found");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const result = JSON.parse(data);
    if (result.id) {
      const call = pending.get(result.id);
      if (call) {
        clearTimeout(call.timer);
        call.resolve(result);
      }
      pending.delete(result.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const callId = ++id;
      const timer = setTimeout(() => {
        pending.delete(callId);
        reject(new Error("Browser check timed out"));
      }, 20000);
      pending.set(callId, { resolve, timer });
      socket.send(JSON.stringify({ id: callId, method, params }));
    });
  try {
    const viewportWidth = Number(process.env.TE_BROWSER_VIEWPORT_WIDTH);
    if (Number.isInteger(viewportWidth) && viewportWidth >= 320) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: viewportWidth,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }
    if (
      ["light", "dark", "reset"].includes(process.env.TE_BROWSER_COLOR_SCHEME)
    ) {
      await send("Page.bringToFront");
      await send("Emulation.setEmulatedMedia", {
        features:
          process.env.TE_BROWSER_COLOR_SCHEME === "reset"
            ? []
            : [
                {
                  name: "prefers-color-scheme",
                  value: process.env.TE_BROWSER_COLOR_SCHEME,
                },
              ],
      });
    }
    if (process.env.TE_BROWSER_EXPRESSION) {
      const result = await send("Runtime.evaluate", {
        expression: process.env.TE_BROWSER_EXPRESSION,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.error || result.result?.exceptionDetails) {
        const detail =
          result.result?.exceptionDetails?.exception?.description?.split(
            "\n",
          )[0];
        throw new Error(detail || "Browser evaluation failed");
      }
      console.log(JSON.stringify(result.result?.result?.value ?? null));
    }
    if (process.env.TE_BROWSER_SCREENSHOT) {
      const result = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(
        process.env.TE_BROWSER_SCREENSHOT,
        Buffer.from(result.result.data, "base64"),
      );
    }
  } finally {
    socket.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
