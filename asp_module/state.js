// state.js
export const state = {
  // konfiguracja
  pxPerMin: 1,
  axisStartHour: 6,

  // stan osi / UI
  axisBaseStart: null, // Date: wybrany dzień o 06:00
  hoursRendered: 0,

  // indeks ścieżek maszyn -> elementy DOM torów
  machinesIndex: new Map(),

  // konflikty / edycja
  conflictData: {},
  currentEditBlock: null,
};
