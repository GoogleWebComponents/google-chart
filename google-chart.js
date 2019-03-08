/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at https://polymer.github.io/LICENSE.txt
The complete set of authors may be found at https://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at https://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at https://polymer.github.io/PATENTS.txt
*/
import '@polymer/iron-ajax/iron-request.js';
import './google-chart-loader.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';

/**
`google-chart` encapsulates Google Charts as a web component, allowing you to easily visualize
data. From simple line charts to complex hierarchical tree maps, the chart element provides a
number of ready-to-use chart types.

    <google-chart
      type='pie'
      options='{"title": "Distribution of days in 2001Q1"}'
      cols='[{"label":"Month", "type":"string"}, {"label":"Days", "type":"number"}]'
      rows='[["Jan", 31],["Feb", 28],["Mar", 31]]'>
    </google-chart>

Note: if you're passing JSON as attributes, single quotes are necessary to be valid JSON.
See https://www.polymer-project.org/1.0/docs/devguide/properties#configuring-object-and-array-properties.

Height and width are specified as style attributes:

    google-chart {
      height: 300px;
      width: 50em;
    }

Data can be provided in one of three ways:

- Via the `cols` and `rows` attributes:

      cols='[{"label":"Mth", "type":"string"}, {"label":"Days", "type":"number"}]'
      rows='[["Jan", 31],["Feb", 28],["Mar", 31]]'

- Via the `data` attribute, passing in the data directly:

      data='[["Month", "Days"], ["Jan", 31], ["Feb", 28], ["Mar", 31]]'

- Via the `data` attribute, passing in the URL to a resource containing the
  data, in JSON format:

      data='http://example.com/chart-data.json'

- Via the `data` attribute, passing in a Google DataTable object:

      data='{{dataTable}}'

- Via the `view` attribute, passing in a Google DataView object:

      view='{{dataView}}'

You can display the charts in locales other than "en" by setting the `lang` attribute
on the `html` tag of your document.

    <html lang="ja">

@demo
*/
Polymer({
  /** @override */
  _template: html`
    <style>
      :host {
        display: -webkit-flex;
        display: -ms-flex;
        display: flex;
        margin: 0;
        padding: 0;
        width: 400px;
        height: 300px;
      }

      :host([hidden]) {
        display: none;
      }

      :host([type="gauge"]) {
        width: 300px;
        height: 300px;
      }

      #chartdiv {
        width: 100%;
      }
    </style>
    <div id="styles"></div>
    <google-chart-loader id="loader" type="[[type]]"></google-chart-loader>
    <div id="chartdiv"></div>
  `,

  is: 'google-chart',

  /**
   * Fired after a chart type is rendered and ready for interaction.
   *
   * @event google-chart-ready
   * @param {{chart: !Object}} The raw chart object.
   */

  /**
   * Fired when the user makes a selection in the chart.
   *
   * @event google-chart-select
   * @param {{chart: !Object}} The raw chart object.
   */

  /** Polymer element properties. */
  properties: {
    /**
     * Sets the type of the chart.
     *
     * Should be one of:
     * - `area`
     * - `(md-)bar`
     * - `bubble`
     * - `calendar`
     * - `candlestick`
     * - `column`
     * - `combo`
     * - `gauge`
     * - `geo`
     * - `histogram`
     * - `(md-)line`
     * - `org`
     * - `pie`
     * - `sankey`
     * - `(md-)scatter`
     * - `stepped-area`
     * - `table`
     * - `timeline`
     * - `treemap`
     * - `wordtree`
     *
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/gallery">Google Visualization API reference (Chart Gallery)</a>
     * for details.
     */
    type: {
      type: String,
      value: 'column',
      observer: '_typeChanged'
    },

    /**
     * Enumerates the chart events that should be fired.
     *
     * Charts support a variety of events. By default, this element only
     * fires on `ready` and `select`. If you would like to be notified of
     * other chart events, use this property to list them.
     * Events `ready` and `select` are always fired.
     * Changes to this property are _not_ observed. Events are attached only
     * at chart construction time.
     *
     * @type {!Array<string>}
     */
    events: {
      type: Array,
      value: function() { return []; }
    },

    /**
     * Sets the options for the chart.
     *
     * Example:
     * <pre>{
     *   title: "Chart title goes here",
     *   hAxis: {title: "Categories"},
     *   vAxis: {title: "Values", minValue: 0, maxValue: 2},
     *   legend: "none"
     * };</pre>
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/gallery">Google Visualization API reference (Chart Gallery)</a>
     * for the options available to each chart type.
     *
     * This property is observed via a deep object observer.
     * If you would like to make changes to a sub-property, be sure to use the
     * Polymer method `set`: `googleChart.set('options.vAxis.logScale', true)`
     * (Note: Missing parent properties are not automatically created.)
     *
     * @type {!Object|undefined}
     */
    options: {
      type: Object
    },

    /**
     * Sets the data columns for this object.
     *
     * When specifying data with `cols` you must also specify `rows`, and
     * not specify `data`.
     *
     * Example:
     * <pre>[{label: "Categories", type: "string"},
     *  {label: "Value", type: "number"}]</pre>
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/reference#DataTable_addColumn">Google Visualization API reference (addColumn)</a>
     * for column definition format.
     *
     * @type {!Array|undefined}
     */
    cols: {
      type: Array,
      observer: '_rowsOrColumnsChanged',
    },

    /**
     * Sets the data rows for this object.
     *
     * When specifying data with `rows` you must also specify `cols`, and
     * not specify `data`.
     *
     * Example:
     * <pre>[["Category 1", 1.0],
     *  ["Category 2", 1.1]]</pre>
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/reference#addrow">Google Visualization API reference (addRow)</a>
     * for row format.
     *
     * @type {!Array<!Array>|undefined}
     */
    rows: {
      type: Array,
      observer: '_rowsOrColumnsChanged',
    },

    /**
     * Sets the entire dataset for this object.
     * Can be used to provide the data directly, or to provide a URL from
     * which to request the data.
     *
     * The data format can be a two-dimensional array or the DataTable format
     * expected by Google Charts.
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/reference#DataTable">Google Visualization API reference (DataTable constructor)</a>
     * for data table format details.
     *
     * When specifying data with `data` you must not specify `cols` or `rows`.
     *
     * Example:
     * <pre>[["Categories", "Value"],
     *  ["Category 1", 1.0],
     *  ["Category 2", 1.1]]</pre>
     *
     * @type {!google.visualization.DataTable|
     *        !Array<!Array>|
     *        {cols: !Array, rows: (!Array<!Array>|undefined)}|
     *        string|
     *        undefined}
     */
    data: {
      type: String,
      observer: '_dataChanged'
    },

    /**
     * Sets the entire dataset for this object to a Google DataView.
     *
     * See <a href="https://google-developers.appspot.com/chart/interactive/docs/reference#dataview-class">Google Visualization API reference (DataView)</a>
     * for details.
     *
     * When specifying data with `view` you must not specify `data`, `cols` or `rows`.
     *
     * @type {!google.visualization.DataView|undefined}
     */
    view: {
      type: Object,
      observer: '_viewChanged'
    },

    /**
     * Selected datapoint(s) in the chart.
     *
     * An array of objects, each with a numeric row and/or column property.
     * `row` and `column` are the zero-based row or column number of an item
     * in the data table to select.
     *
     * To select a whole column, set row to null;
     * to select a whole row, set column to null.
     *
     * Example:
     * <pre>
     *   [{row:0,column:1}, {row:1, column:null}]
     * </pre>
     *
     * @type {!Array|undefined}
     */
    selection: {
      type: Array,
      notify: true,
      observer: '_setSelection'
    },

    /**
     * Whether the chart is currently rendered.
     */
    drawn: {
      type: Boolean,
      readOnly: true,
      value: false
    },

    /** @type {?Object} Internal Google Visualization chart object */
    _chart: {
      type: Object,
      value: null,
    },

    /** @type {?google.visualization.DataView} Internal data state */
    _dataView: {
      type: Object,
      value: null,
    },
  },

  observers: [
    '_draw(_chart, _dataView)',
    '_subOptionChanged(options.*)'
  ],

  listeners: {
    'google-chart-select': '_updateSelection',
    'google-chart-ready': '_onChartReady'
  },

  /** @type {?Array} Internal selection state */
  _selection: null,

  /** Reacts to chart type change. */
  _typeChanged: function() {
    // We need to create a new chart and redraw.
    const loader = /** @type {!GoogleChartLoaderElement} */ (this.$.loader);
    loader.create(this.type, this.$.chartdiv)
        .then(function(chart) {

          // only add link stylesheet elements if there are none already
          if (!this.$.styles.children.length) {
            this._localizeGlobalStylesheets();
          }

          Object.keys(this.events.concat(['select', 'ready'])
              .reduce(function(set, eventName) {
                set[eventName] = true;
                return set;
              }, {}))
              .forEach(function(eventName) {
                loader.fireOnChartEvent(chart, eventName);
              });
          this._setDrawn(false);
          this._chart = chart;
        }.bind(this));
  },

  /** Reacts to `options` subproperty change. */
  _subOptionChanged: function(optionChangeDetails) {
    this.options = optionChangeDetails.base;
    // Debounce to allow for multiple option changes in one redraw
    this.debounce('optionChangeRedraw', () => {
      this.redraw();
    }, 5);
  },

  /** Sets the selectiton on the chart. */
  _setSelection: function() {
    // Note: Some charts (e.g. TreeMap) must have a selection.
    if (!this.drawn || !this.selection || this.selection === this._selection) {
      return;
    }

    if (this._chart.setSelection) {
      this._chart.setSelection(this.selection);
    }
    this._selection = this.selection;
  },

  /** Updates current selection. */
  _updateSelection: function() {
    const selection = this._chart.getSelection();
    this._selection = selection;
    this.selection = selection;
  },

  /** Reacts to chart ready event. */
  _onChartReady: function() {
    this._setDrawn(true);
    this._selection = null;
    this._setSelection();
  },

  /**
   * Redraws the chart.
   *
   * Called automatically when data/type/selection attributes change.
   * Call manually to handle view updates, page resizes, etc.
   *
   * @method redraw
   */
  redraw: function() {
    if (!this._chart || !this._dataView) { return; }
    this._draw(this._chart, this._dataView);
  },

  /**
  * Renders the chart using the provided data.
  * @param {?Object|undefined} chart Internal Google Visualization chart object.
  * @param {?google.visualization.DataView|undefined} data  Internal data state
  */
  _draw: function(chart, data) {
    if(chart == null || data == null) {
      return;
    }
    try {
      this._setDrawn(false);
      chart.draw(data, this.options || {});
    } catch(error) {
      this.$.chartdiv.textContent = error;
    }
  },

  /**
   * Returns the chart serialized as an image URI.
   *
   * Call this after the chart is drawn (google-chart-render event).
   *
   * @return {?string} Returns image URI.
   */
  get imageURI() {
    if (!this._chart) { return null; }
    return this._chart.getImageURI();
  },

  /**
   * Handles changes to the `view` attribute.
   *
   * @param {!google.visualization.DataView|undefined} view The new view value
   */
  _viewChanged: function(view) {
    if (!view) { return; }
    this._dataView = view;
  },

  /** Handles changes to the rows & columns attributes. */
  _rowsOrColumnsChanged: function() {
    var rows = this.rows, cols = this.cols;
    if (!rows || !cols) { return; }
    const loader = /** @type {!GoogleChartLoaderElement} */ (this.$.loader);
    loader.dataTable(undefined)
      .then(function(dataTable) {
        cols.forEach(function(col) {
          dataTable.addColumn(col);
        });
        dataTable.addRows(rows);
        return dataTable;
      }.bind(this))
      .then(loader.dataView.bind(loader))
      .then(function(dataView) {
        this._dataView = dataView;
      }.bind(this))
      .catch(function(reason) {
        this.$.chartdiv.textContent = reason;
      }.bind(this));
  },

  /**
   * Handles changes to the `data` attribute.
   *
   * @param {
   *     !google.visualization.DataTable|
   *     !Array<!Array>|
   *     {cols: !Array, rows: (!Array<!Array>|undefined)}|
   *     string|
   *     undefined} data The new data value
   */
  _dataChanged: function(data) {
    var dataPromise;
    if (!data) { return; }

    var isString = false;

    // Polymer 2 will not call observer if type:Object is set and fails, so
    // we must parse the string ourselves.
    try {
      /**
       * @suppress {checkTypes} `JSON.parse` expects a string but here it tries to deserialize
       * the value of the `data` property which might be a serialized array.
       */
      data = JSON.parse(data);
    } catch (e) {
      isString = typeof data == 'string' || data instanceof String;
    }

    if (isString) {
      // Load data asynchronously, from external URL.
      var request = /** @type {!IronRequestElement} */ (document.createElement('iron-request'));
      dataPromise = request.send({
        url: /** @type {string} */ (data), handleAs: 'json'
      }).then(function(xhr) {
        return xhr.response;
      });
    } else {
      // Data is all ready to be processed.
      dataPromise = Promise.resolve(data);
    }
    const loader = /** @type {!GoogleChartLoaderElement} */ (this.$.loader);
    dataPromise
      .then(loader.dataTable.bind(loader))
      .then(loader.dataView.bind(loader))
      .then(function(dataView) {
        this._dataView = dataView;
      }.bind(this));
  },

  /**
   * Queries global document head for google charts link#load-css-* and clones
   * them into the local root's div#styles element for shadow dom support.
   */
  _localizeGlobalStylesheets: function() {
    // get all gchart stylesheets
    var stylesheets = dom(document.head)
        .querySelectorAll('link[rel="stylesheet"][type="text/css"]');

    var stylesheetsArray = Array.from(stylesheets);

    for (var i = 0; i < stylesheetsArray.length; i++) {
      var sheetLinkEl = stylesheetsArray[i];
      var isGchartStylesheet = sheetLinkEl.id.indexOf('load-css-') == 0;

      if (isGchartStylesheet) {
        // clone necessary stylesheet attributes
        var clonedLinkEl = document.createElement('link');
        clonedLinkEl.setAttribute('rel', 'stylesheet');
        clonedLinkEl.setAttribute('type', 'text/css');
        clonedLinkEl.setAttribute('href', sheetLinkEl.getAttribute('href'));

        dom(this.$.styles).appendChild(clonedLinkEl);
      }
    }
  }
});
