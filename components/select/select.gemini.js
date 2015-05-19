var gemini = require('gemini');

gemini.suite('Select', function () {

  gemini.suite('Disabled select button', function (child) {
    child.setUrl('/example-disabled-select')
      .setCaptureElements('#demo1')
      .ignoreElements('.ring-select__icons')
      .capture('plain');
  });

  gemini.suite('Input based select', function (child) {
    child
      .setUrl('/example-simple-input-based-select')
      .setCaptureElements('.ring-select', '.ring-popup')
      .capture('selectPopup', function (actions, find) {
        actions.click(find('.ring-input'));
      });
  });

  gemini.suite('Select with filter', function (child) {
    child
      .setUrl('/example-simple-select-with-default-filter-mode')
      .setCaptureElements('.ring-select', '.ring-popup')
      .capture('selectPopup', function (actions, find) {
        actions.click(find('.ring-select'));
        actions.click(find('.ring-popup .ring-input'));
      });
  });

});