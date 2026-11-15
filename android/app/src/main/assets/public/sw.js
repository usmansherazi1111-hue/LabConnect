/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-8d0d8005'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "6b4ab2b8be7edd1985574ade132308ce"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7d1cf2469d3e49df913cdb89a6b286f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ac2133c8211957453459b1f34a1a7bc2"
  }, {
    "url": "index.html",
    "revision": "bfddc286b0b2bdc1266cf48f09fd9891"
  }, {
    "url": "icon.svg",
    "revision": "4cac09cc2492291ebc2a173feb9335c8"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8fafa5f67f702a90215397c51ee56bed"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-DtG36x4w.css",
    "revision": null
  }, {
    "url": "assets/index-DOXaLdNo.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8fafa5f67f702a90215397c51ee56bed"
  }, {
    "url": "icon.svg",
    "revision": "4cac09cc2492291ebc2a173feb9335c8"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ac2133c8211957453459b1f34a1a7bc2"
  }, {
    "url": "pwa-512x512.png",
    "revision": "d7d1cf2469d3e49df913cdb89a6b286f"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6b4ab2b8be7edd1985574ade132308ce"
  }, {
    "url": "manifest.webmanifest",
    "revision": "89b4864497a13fc1d49d36a733af2e68"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(/^\/api\/(catalog|tests|laboratories|reviews)/i, new workbox.NetworkFirst({
    "cacheName": "labconnect-catalog-cache",
    "networkTimeoutSeconds": 4,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 86400
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
