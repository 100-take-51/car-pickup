/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// 最小：型エラー回避（実行挙動は変えない）
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("push", (event: any) => {
  event.waitUntil(
    (async () => {
      let data: any = {};
      try {
        // JSONで来たらJSONとして読む
        data = event.data ? await event.data.json() : {};
      } catch {
        // DevToolsのPushはただの文字列が来ることがあるのでtextで拾う
        const text = event.data ? await event.data.text() : "";
        data = { title: "Test push", body: text || "（empty）", url: "/admin/pickup" };
      }

      const title = data.title ?? "新規問い合わせ";
      const body = data.body ?? "管理画面を確認してください";
      const url = data.url ?? "/admin/pickup";

      await self.registration.showNotification(title, {
        body,
        data: { url },
      });
    })()
  );
});


self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = event.notification?.data?.url ?? "/admin/pickup";
  event.waitUntil(self.clients.openWindow(url));
});
