/* Look & See, Color Me! Paint: in-app purchase bridge for the native apps.
 * Gives the web app window.ColorMeStore = { available, buy(id), restore(), priceOf(id) }.
 * Uses cordova-plugin-purchase (CdvPurchase) with Google Play Billing / StoreKit.
 * One non-consumable product per book. No accounts, no server, no tracking:
 * ownership comes from the store receipt on the device. */
(function () {
  var PRODUCTS = ['ocean_animals_book'];
  var ready = null;

  function markOwned(id) {
    var book = id.replace(/_book$/, '').split('_')[0]; // ocean_animals_book -> ocean
    try {
      var o = JSON.parse(localStorage.getItem('colorme-owned')) || [];
      if (o.indexOf(book) < 0) { o.push(book); localStorage.setItem('colorme-owned', JSON.stringify(o)); }
    } catch (_) {}
  }

  function init() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      document.addEventListener('deviceready', function () {
        var C = window.CdvPurchase;
        if (!C) { resolve(null); return; }
        var store = C.store;
        var platform = C.Platform && (window.Capacitor && window.Capacitor.getPlatform() === 'ios'
          ? C.Platform.APPLE_APPSTORE : C.Platform.GOOGLE_PLAY);
        store.register(PRODUCTS.map(function (id) {
          return { id: id, type: C.ProductType.NON_CONSUMABLE, platform: platform };
        }));
        store.when()
          .approved(function (t) { t.finish(); })
          .finished(function (t) { (t.products || []).forEach(function (p) { markOwned(p.id); }); });
        store.initialize([platform]).then(function () {
          PRODUCTS.forEach(function (id) { if (store.owned(id)) markOwned(id); });
          resolve(store);
        }, function () { resolve(null); });
      }, false);
    });
    return ready;
  }

  function waitOwned(store, id, ms) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function tick() {
        if (store.owned(id)) return resolve(true);
        if (Date.now() - t0 > ms) return resolve(false);
        setTimeout(tick, 500);
      })();
    });
  }

  window.ColorMeStore = {
    available: true,
    priceOf: function (id) {
      var s = window.CdvPurchase && window.CdvPurchase.store;
      var p = s && s.get(id);
      return (p && p.pricing && p.pricing.price) || '';
    },
    buy: function (id) {
      return init().then(function (store) {
        if (!store) return false;
        if (store.owned(id)) { markOwned(id); return true; }
        var p = store.get(id); var offer = p && p.getOffer();
        if (!offer) return false;
        return store.order(offer).then(function (err) {
          if (err) return false; // cancelled or failed: nothing charged
          return waitOwned(store, id, 120000);
        });
      });
    },
    restore: function () {
      return init().then(function (store) {
        if (!store) return [];
        return store.restorePurchases().then(function () {
          return PRODUCTS.filter(function (id) { if (store.owned(id)) { markOwned(id); return true; } return false; });
        });
      });
    }
  };
  init();
})();
