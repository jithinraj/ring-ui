/**
 * @description Displays a popup with select's options.
 */

import React from 'react';
import classNames from 'classnames';

import RingComponentWithShortcuts from '../ring-component/ring-component_with-shortcuts';
import Popup from '../popup/popup';
import List from '../list/list';
import Icon from '../icon/icon';
import LoaderInline from '../loader-inline/loader-inline';
import shortcutsHOC from '../shortcuts/shortcuts-hoc';
import {preventDefault} from '../global/dom';
import getUID from '../global/get-uid';

import SelectFilter from './select__filter';
import styles from './select.css';

const INPUT_MARGIN_COMPENSATION = -14;
const FILTER_HEIGHT = 35;

function noop() {}

const FilterWithShortcuts = shortcutsHOC(SelectFilter);

export default class SelectPopup extends RingComponentWithShortcuts {
  isClickingPopup = false; // This flag is to true while an item in the popup is being clicked

  static defaultProps = {
    data: [],
    activeIndex: null,
    toolbar: null,
    filter: false, // can be either boolean or an object with "value" and "placeholder" properties
    message: null,
    anchorElement: null,
    maxHeight: 600,
    loading: false,
    onSelect: noop,
    onCloseAttempt: noop,
    onFilter: noop,
    onClear: noop,
    onLoadMore: noop
  };

  state = {
    popupShortcuts: false,
    popupFilterShortcutsOptions: {
      modal: true,
      disabled: true
    }
  };

  popupFilterShortcuts = {
    map: {
      up: e => (this.list && this.list.upHandler(e)),
      down: e => (this.list && this.list.downHandler(e)),
      enter: e => (this.list && this.list.enterHandler(e)),
      esc: e => this.props.onCloseAttempt(e),
      tab: e => this.tabPress(e)
    }
  };

  popupFilterOnFocus = () => this._togglePopupFilterShortcuts(false);
  popupFilterOnBlur = () => this._togglePopupFilterShortcuts(true);

  _togglePopupFilterShortcuts(value) {
    this.setState({
      popupFilterShortcutsOptions: {
        modal: true,
        disabled: value
      }
    });
  }

  didMount() {
    window.document.addEventListener('mouseup', this.mouseUpHandler);
    this.focus();
  }

  willReceiveProps(nextProps) {
    if (nextProps.hidden !== this.props.hidden) {
      this.setState({
        popupShortcuts: !nextProps.hidden,
        shortcuts: !nextProps.hidden && this.props.filter
      });
    }
  }

  didUpdate() {
    this.focus();
  }

  willUnmount() {
    window.document.removeEventListener('mouseup', this.mouseUpHandler);
  }

  focus() {
    setTimeout(() => {
      if (this.filter) {
        findDOMNode(this.filter).focus();
      }
    }, 0);
  }

  getShortcutsProps() {
    return {
      map: {
        tab: this.tabPress
      },
      scope: getUID('select-popup-')
    };
  }

  listOnMouseOut = () => {
    this.list.clearSelected();
  };

  mouseDownHandler = () => {
    this.isClickingPopup = true;
  };

  mouseUpHandler = () => {
    this.isClickingPopup = false;
  };

  listScrollToIndex(index) {
    this.list && this.list.setActiveItem(index);
  }

  isVisible() {
    return this.popup && this.popup.isVisible();
  }

  onListSelect = selected => {
    const getSelectItemEvent = () => {
      let event;
      if (document.createEvent) {
        event = document.createEvent('Event');
        event.initEvent('select', true, false);
      }
      return event;
    };

    this.props.onSelect(selected, getSelectItemEvent());
  };

  tabPress = event => {
    preventDefault(event);

    const listActiveItem = this.list && this.list.state.activeItem;
    if (listActiveItem) {
      this.onListSelect(listActiveItem);
    }
    this.props.onCloseAttempt();
  };

  filterRef = el => {
    this.filter = el;
  };

  getFilter() {
    if (this.props.filter && !this.props.hidden) {
      return (
        <div className={styles.filterWrapper}>
          <Icon
            className={styles.filterIcon}
            glyph={require('jetbrains-icons/search.svg')}
            size={Icon.Size.Size18}
          />
          <FilterWithShortcuts
            rgShortcutsOptions={this.state.popupFilterShortcutsOptions}
            rgShortcutsMap={this.popupFilterShortcuts.map}

            value={this.props.filterValue}
            inputRef={this.filterRef}
            onBlur={this.popupFilterOnBlur}
            onFocus={this.popupFilterOnFocus}
            className="ring-js-shortcuts"
            placeholder={this.props.filter.placeholder}
            onChange={this.props.onFilter}
            onClear={this.props.onClear}
          />
        </div>
      );
    }

    return null;
  }

  getBottomLine() {
    return (<div>
      {this.props.loading && <LoaderInline/>}

      {this.props.message &&
      <div className={styles.message}>{this.props.message}</div>}
    </div>);
  }

  listRef = el => {
    this.list = el;
  };

  getList() {
    if (this.props.data.length) {
      let {maxHeight} = this.props;
      if (this.props.filter) {
        maxHeight -= FILTER_HEIGHT;
      }

      return (
        <List
          maxHeight={maxHeight}
          data={this.props.data}
          activeIndex={this.props.activeIndex}
          ref={this.listRef}
          restoreActiveIndex={true}
          activateSingleItem={true}
          onSelect={this.onListSelect}
          onMouseOut={this.listOnMouseOut}
          onScrollToBottom={this.props.onLoadMore}
          shortcuts={this.state.popupShortcuts}
          disableMoveDownOverflow={this.props.loading}
        />
      );
    }

    return null;
  }

  popupRef = el => {
    this.popup = el;
  };

  listRef = el => {
    this.list = el;
  };

  filterRef = el => {
    this.filter = el;
  };

  render() {
    const classes = classNames(styles.popup, this.props.className);

    return (
      <Popup
        ref={this.popupRef}
        hidden={this.props.hidden}
        attached={this.props.isInputMode}
        className={classes}
        dontCloseOnAnchorClick={true}
        keepMounted={true}
        anchorElement={this.props.anchorElement}
        minWidth={this.props.minWidth}
        onCloseAttempt={this.props.onCloseAttempt}
        directions={this.props.directions}
        top={this.props.top || (this.props.isInputMode ? INPUT_MARGIN_COMPENSATION : null)}
        left={this.props.left}
        onMouseDown={this.mouseDownHandler}
      >
        {this.getFilter()}
        {this.getList()}
        {this.getBottomLine()}
        {this.props.toolbar}
      </Popup>
    );
  }
}
