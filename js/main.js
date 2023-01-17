window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      // .register('./sw.js');
      .register('https://rajeevmsn.github.io/bangleTest/sw.js');

  }
};
