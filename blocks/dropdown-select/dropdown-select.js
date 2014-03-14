define([
  'jquery',
  'global/global__views',
  'global/global__modules',
  'global/global__events',
  'global/global__utils',
  'delayed-listener/delayed-listener',
  'action-list/action-list'
], function ($, View, Module, events, utils) {
  'use strict';

  var MODULE = 'dropdown-select',
    RESULT_COUNT = 10;

  var
    actionList = Module.get('action-list'),
    delayedListener = Module.get('delayed-listener'),
    uid = 0;

//  config = {
//    target: DOM,
//    $top: number
//    onChange: function(data),
//    onListShow: function()
//    onListHide: function()
//    dataSource: {return promise with action-list compatible data},
//  }
  var init = function (config) {
    uid += 1;
    var select = Module.get(MODULE),
      $top,
      instance = {
        uid: uid,
        remove: remove
      };

    if (!config && (!config.target || !config.dataSource)) {
      utils.log('select: init params missing');
      select.trigger('init:fail');
      return false;
    }

    if (config.$top && !isNaN(config.$top)) {
      $top = config.$top;
    }

    ring().on('dialog:hide', function () {
      remove();
    });

    actionList.on('show', function (data) {
      if (typeof config.onShow === 'function' && data) {
        config.onShow(data);
      }
    });

    actionList.on('hide', function (data) {
      if (typeof config.onHide === 'function' && data) {
        config.onHide(data);
      }
    });

    var initActionList = function (data, preventEvent) {
      actionList('init', {
        target: $(config.target),
        type: ['bound'],
        width: ($(config.target).outerWidth() - 2) + 'px',
        items: data
      });

      if (!preventEvent) {
        actionList.on('change_' + actionList('getUID'), function (data) {
          if (typeof config.onChange === 'function') {
            config.onChange(data);
          }
        });
      }
    };

    var _renderSuggest = function (query) {
      config.dataSource(query, $top).then(function (data) {
        if (!data.length) {
          data = [
            {
              action: false,
              label: 'No results'
            }
          ];
        }

        initActionList(data);

      }, function () {
        initActionList([
          {
            action: false,
            className: 'ring-dropdown__item_error',
            label: 'Internal error'
          }
        ], true);
      });
    };

    var dirty = false;

    $(config.target)
      .on('input', function () {
        dirty = true;
      })
      .on('blur', function () {
        dirty = false;
      });

    delayedListener('init', {
      target: $(config.target),
      onDelayedChange: function (data) {
        if ($(config.target).is(':focus')) {
          if (dirty) {
            _renderSuggest(data.value);
          } else {
            _renderSuggest('');
            $(config.target).select();
          }
        }
      },
      onDelayedCaretMove: function (data) {
        if ($(config.target).is(':focus')) {
          if (dirty) {
            _renderSuggest(data.value);
          } else {
            _renderSuggest('');
            $(config.target).select();
          }
        }
      }
    });

    select.trigger('init:done', {});
    return instance;
  };

  var remoteDataSource = function (remoteDataSourceConfig) {
    var select = Module.get(MODULE);
    var auth = Module.get('auth');

    if (!remoteDataSourceConfig && (!remoteDataSourceConfig.hubResource || !remoteDataSourceConfig.url)) {
      utils.log('Select: remoteDataSource params missing');
      select.trigger('init:fail');
      return false;
    }

    return function (query, $top) {
      var defer = $.Deferred(),
        restUrl = remoteDataSourceConfig.url,
        substr = ['query', '$top'],
        suggestArgs = [encodeURI(query)];

      substr.forEach(function (item, index) {
        restUrl = restUrl.replace('#{' + item  + '}', suggestArgs[index] ? suggestArgs[index] : '');
      });

      restUrl = restUrl + '&$top=' + (($top || RESULT_COUNT) + 1);

      auth('get', restUrl).then(function (data, state, jqXHR) {
        var items = [];
        if (data[remoteDataSourceConfig.hubResource]) {
          items = data[remoteDataSourceConfig.hubResource].map(function (val) {
            return {
              label: val.name
            };
          });
        }

        if (items.length >= $top) {
          items.splice(items.length - 1, items.length);
          items.push({
            event: false,
            label: '...'
          });
        }

        defer.resolve(items, state, jqXHR);
      }, function () {
        defer.reject.apply(defer, arguments);
      });

      return defer.promise();
    };
  };

  var remove = function () {
    var select = Module.get(MODULE);
    actionList('remove');
    select.trigger('remove:done');
  };

  Module.add(MODULE, {
    init: {
      method: init,
      override: true
    },
    remoteDataSource: {
      method: remoteDataSource,
      override: true
    }
  });
});