// localization for browser

const Localize = (function () {

  const LANGUAGE_DEFAULT = 'us';

  let englishStrings = {
    language: 'US English',
    languageTitle: 'Language',
    serverAliveTitle: 'The server is online',
    serverNotAliveTitle: 'The server is offline',
    restaurantApps: 'Restaurant apps',
    deliciouslyDesigned: 'deliciously designed',
    restaurant: 'Restaurant',
    password: 'Password',
    waitListLength: 'Wait list length',
    waitListFor: 'Waiting list for',
    at: 'at',
    waitListForTableAt: 'Waiting list for a table at',
    continue: 'Continue',
    enter: 'Enter',
    offline: 'Offline',
    isClosed: 'is currently closed',
    wlOnlyAvailDuringHrs: 'Waitling list is only available during restaurant hours',
    waitTimes: 'Wait Times',
    listIsEmpty: 'List is currently empty',
    guests: 'Guests',
    guestsTitle: 'Number of guests in group',
    group: 'group',
    groups: 'groups',
    est: 'Est.',
    waiting: 'Waiting',
    waitingTitle: 'Number of minutes waiting',
    remaining: 'to go',
    tableSize: 'Table Size',
    minutes: 'mins',
    minutesTitle: 'Minutes',
    none: 'none',
    waitingList: 'Waiting List',
    hello: 'Hello',
    yourTableFor: 'Your table for',
    isReadyEnjoy: 'is ready, enjoy your meal',
    tableReadyMessage: 'Your table is ready, enjoy your meal',
    youAreCurrently: 'You are currently',
    inLineFor: 'in line to be seated at a table for',
    yourEstWaitTime: 'Your estimated wait time is',
    yourPartyWillBe: 'Your group will be seated when everyone is present',
    joinWaitingList: 'Join Waiting List',
    refresh: 'Refresh',
    change: 'Change',
    chat: 'Chat',
    seat: 'Seat guests',
    remove: 'Remove',
    join: 'Join',
    add: 'Add',
    logout: 'Logout',
    titleAddNew: 'Add New',
    makeChangesBelow: 'Make desired changes to your waiting list entry below',
    createNewBelow: 'Create a new waiting list entry below',
    toAddYourName: 'To add your name to the',
    waitingListLc: 'waiting list',
    enterInfoBelow: 'enter your information below',
    nameLabel: 'Name',
    nameTitle: 'Name of group',
    peopleLabel: 'People',
    phoneLabel: 'Phone',
    textNotifications: 'Text Notifications',
    specialNotes: 'Special Notes',
    notes: 'Notes',
    backLabel: 'Back',
    saveLabel: 'Save',
    permanentlyRemove: 'Permanently remove',
    permanentlyChange: 'Permanently change',
    fromTheList: 'from the waiting list',
    to: 'to',
    keepLabel: 'Keep',
    dontChange: 'Don\'t Change',
    okay: 'Okay',
    posNames: ['zeroth','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth'],
    nth: 'th',
    yourTableIsReady: 'Your table is ready',
    unablePhoneValidate: 'Unable to validate phone number',
    for: 'for',
    entryGone: 'Your waiting list entry no longer exists',
    restaurantGetFail1: 'Unable to get restaurant info from the server',
    restaurantGetFail2: 'Server may be unavailable or restaurant info may not exist',
    isOPEN: 'is OPEN',
    isCLOSED: 'is CLOSED',
    createdTitle: 'Created',
    sendA: 'Send',
    messageTo: 'message to',
    dontSend: 'Don\'t Send',
    send: 'Send',
    cancel: 'Cancel',
    sendTableReady: 'Send table is ready message',
    pleaseLogin: 'please login'
  };

  let spanishStrings = {
    language: 'Español',
    languageTitle: 'Idioma',
    serverAliveTitle: 'El servidor esta activo',
    serverNotAliveTitle: 'El servidor esta inactivo',
    restaurantApps: 'Aplicaciones de restaurante',
    deliciouslyDesigned: 'deliciosamente diseñado',
    restaurant: 'Restaurante',
    password: 'Contraseña',
    waitListLength: 'Longitud de la lista de espera',
    waitListFor: 'Lista de espera para',
    at: 'a',
    waitListForTableAt: 'Lista de espera para una mesa en',
    continue: 'Continuar',
    enter: 'Entrar',
    offline: 'Desconectado',
    isClosed: 'esta cerrado actualmente',
    wlOnlyAvailDuringHrs: 'La lista de espera solo está disponible durante las horas del restaurante',
    waitTimes: 'Tiempos de espera',
    listIsEmpty: 'La lista está actualmente vacía',
    guests: 'Gente',
    guestsTitle: 'Numero de invitados en grupo',
    group: 'grupo',
    groups: 'grupos',
    est: 'Est.',
    waiting: 'Espera',
    waitingTitle: 'Cantidad de minutos de espera',
    remaining: 'restante',
    tableSize: 'Tamaño de la mesa',
    minutes: 'minutos',
    minutesTitle: 'Minutos',
    waitingList: 'Lista de espera',
    none: 'ninguna',
    hello: 'Hola',
    yourTableFor: 'Su mesa para',
    isReadyEnjoy: 'esta listo, disfruta su comida',
    tableReadyMessage: 'Su mesa está lista, disfrutar de su comida',
    youAreCurrently: 'Actualmente estás',
    inLineFor: 'en línea para estar sentado en una mesa para',
    yourEstWaitTime: 'Su tiempo de espera estimado es',
    yourPartyWillBe: 'Su grupo estará sentada cuando todos estén presentes',
    joinWaitingList: 'Unirse a la lista de espera',
    refresh: 'Refrescar',
    change: 'Cambiar',
    chat: 'Charla',
    seat: 'Sentar a los clientes',
    remove: 'Retirar',
    join: 'Unirse',
    add: 'Añadir',
    logout: 'Cerrar',
    titleAddNew: 'Añadir nuevo',
    makeChangesBelow: 'Realice los cambios deseados en la entrada de su lista de espera a continuación',
    createNewBelow: 'Cree una nueva entrada en la lista de espera a continuación',
    toAddYourName: 'Para agregar su nombre a la',
    waitingListLc: 'Lista de espera',
    enterInfoBelow: 'ingrese su información a continuación',
    nameLabel: 'Nombre',
    nameTitle: 'Nombre del grupo',
    peopleLabel: 'Gente',
    phoneLabel: 'Teléfono',
    textNotifications: 'Notificaciones de texto',
    specialNotes: 'Notas especiales',
    notes: 'Notas',
    backLabel: 'Retroceder',
    saveLabel: 'Salvar',
    permanentlyRemove: 'Eliminar permanentemente',
    permanentlyChange: 'Cambiar de forma permanente',
    fromTheList: 'de la lista de espera',
    to: 'a',
    keepLabel: 'Mantener',
    dontChange: 'No cambies',
    okay: 'OK',
    posNames: ['cero','primero','segundo','tercero','cuarto','quinto','sexto','séptimo','octavo','noveno'],
    nth: '',
    yourTableIsReady: 'Su mesa esta lista',
    unablePhoneValidate: 'No se puede validar el número de teléfono',
    for: 'para',
    entryGone: 'Su entrada en la lista de espera ya no existe',
    restaurantGetFail1: 'No se puede obtener información del restaurante del servidor',
    restaurantGetFail2: 'El servidor puede no estar disponible o la información del restaurante puede no existir',
    isOPEN: 'está ABIERTO',
    isCLOSED: 'está CERRADO',
    createdTitle: 'Creado',
    sendA: 'Enviar',
    messageTo: 'mensaje a',
    dontSend: 'No enviar',
    send: 'Enviar',
    cancel: 'Cancelar',
    sendTableReady: 'Enviar mensaje de mesa es listo',
    pleaseLogin: 'por favor Iniciar sesión'
  };

  let languageStrings = {
    'us': englishStrings,
    'mx': spanishStrings
  };
  let userSetLanguage = null;

  // return the currently selected language strings
  function strings(countryCode) {
    return languageStrings[ countryCode || LANGUAGE_DEFAULT ];
  }

  // return current language code
  function currentLanguage() {
    return userSetLanguage || LANGUAGE_DEFAULT;
  }

  /**
   * set the language
   * @param {string} countryCode
   * @return {string}
   */
  function setLanguage(countryCode) {
    userSetLanguage = countryCode;
    return countryCode;
  }

  return {
    languageStrings: strings,
    currentLanguage: currentLanguage,
    setLanguage: setLanguage
  };

})();