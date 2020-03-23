// waitlist client defaults

const WlDefaults = (function () {
  const LANGUAGE_DEFAULT = 'us';

  const isLocalClient = (window.location.href.indexOf("localhost") !== -1);
  const serverUrlDefault = (isLocalClient) ? 'https://localhost:8443' :
    'https://hero.sitsooner.com';

  // default restaurant ID
  const RESTAURANT_ID = 14;

  // max number of messages (old ones will scroll off)
  const maxMessages = 20;

  // time between server-sent events connect attempts
  const SS_RECONECT_INTERVAL = 5000;

  // time between wait time updates
  const WAIT_TIME_UPDATE_INTERVAL = 30000;

  // login authorization properties
  const ACCESS_CUSTOMER = 1;
  const ACCESS_RESTAURANT = 2;
  const ACCESS_MANAGER = 4;
  const ACCESS_ADMIN = 8;

  return {
    LANGUAGE_DEFAULT,
    serverUrlDefault,
    RESTAURANT_ID,
    maxMessages,
    SS_RECONECT_INTERVAL,
    WAIT_TIME_UPDATE_INTERVAL,
    ACCESS_CUSTOMER,
    ACCESS_RESTAURANT,
    ACCESS_MANAGER,
    ACCESS_ADMIN
  }
})();
