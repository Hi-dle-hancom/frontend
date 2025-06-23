// HAPA PWA Service Worker
const CACHE_NAME = "hapa-v1.0.0";
const STATIC_CACHE = "hapa-static-v1.0.0";
const DYNAMIC_CACHE = "hapa-dynamic-v1.0.0";

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  // 폰트 및 기타 정적 리소스
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
];

// 캐시 우선 전략을 사용할 URL 패턴
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:css|js)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// 네트워크 우선 전략을 사용할 URL 패턴
const NETWORK_FIRST_PATTERNS = [/\/api\//, /localhost:8000/];

// 설치 이벤트 - 정적 리소스 캐시
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      })
  );

  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 클라이언트에서 새 SW 제어
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 - 네트워크 요청 인터셉트
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTTPS만 처리 (localhost 제외)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API 요청 처리
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 정적 리소스 처리
  if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // 기본: Stale While Revalidate 전략
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// 캐시 우선 전략
function cacheFirstStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetch(request)
      .then((networkResponse) => {
        // 유효한 응답인 경우에만 캐시
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 오프라인 폴백
        if (request.destination === "document") {
          return caches.match("/");
        }
        return new Response("오프라인 상태입니다.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({
            "Content-Type": "text/plain; charset=utf-8",
          }),
        });
      });
  });
}

// 네트워크 우선 전략
function networkFirstStrategy(request) {
  return fetch(request)
    .then((networkResponse) => {
      // API 응답은 동적 캐시에 저장 (짧은 TTL)
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
          // 동적 캐시 크기 제한 (최대 50개)
          limitCacheSize(DYNAMIC_CACHE, 50);
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // 네트워크 실패 시 캐시에서 조회
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(
          JSON.stringify({
            error: "네트워크 연결을 확인해주세요.",
            offline: true,
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "application/json; charset=utf-8",
            }),
          }
        );
      });
    });
}

// Stale While Revalidate 전략
function staleWhileRevalidateStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => cachedResponse);

    // 캐시된 버전이 있으면 즉시 반환, 백그라운드에서 업데이트
    return cachedResponse || fetchPromise;
  });
}

// URL 패턴 매칭 함수들
function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

// 캐시 크기 제한 함수
function limitCacheSize(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((items) => {
      if (items.length > maxItems) {
        // 가장 오래된 항목부터 삭제
        const oldestItems = items.slice(0, items.length - maxItems);
        oldestItems.forEach((item) => {
          cache.delete(item);
        });
      }
    });
  });
}

// 푸시 알림 처리
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "HAPA에서 새로운 소식이 있습니다.",
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: "open",
        title: "열기",
        icon: "/logo192.png",
      },
      {
        action: "close",
        title: "닫기",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "HAPA", options)
  );
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});

// 백그라운드 동기화
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // 오프라인 중에 저장된 데이터 동기화
      syncOfflineData()
    );
  }
});

// 오프라인 데이터 동기화 함수
function syncOfflineData() {
  return new Promise((resolve) => {
    // 실제 구현에서는 IndexedDB 등에서
    // 오프라인 중에 저장된 데이터를 서버와 동기화
    console.log("[SW] Syncing offline data");
    resolve();
  });
}

// 주기적 백그라운드 동기화
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "content-sync") {
    event.waitUntil(
      // 주기적으로 콘텐츠 업데이트
      updateContent()
    );
  }
});

// 콘텐츠 업데이트 함수
function updateContent() {
  return fetch("/api/v1/updates")
    .then((response) => response.json())
    .then((data) => {
      // 새로운 콘텐츠가 있으면 사용자에게 알림
      if (data.hasUpdate) {
        return self.registration.showNotification("새로운 업데이트", {
          body: "새로운 기능이 추가되었습니다!",
          icon: "/logo192.png",
          tag: "update-notification",
        });
      }
    })
    .catch((error) => {
      console.log("[SW] Failed to check for updates:", error);
    });
}

// 메시지 이벤트 처리 (클라이언트와 통신)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
    return;
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
    return;
  }
});

console.log("[SW] Service Worker loaded and ready");
