/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at https://polymer.github.io/LICENSE.txt
The complete set of authors may be found at https://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at https://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at https://polymer.github.io/PATENTS.txt
*/
import { PolymerElement, html } from '@polymer/polymer';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { createChartWrapper, dataTable } from './loader.js';

const DEFAULT_EVENTS = ['ready', 'select'];

/**
 * Constructor names for supported chart types.
 *
 * `ChartWrapper` expects a constructor name and assumes `google.visualization`
 *  as the default namespace.
 *
 * @type {!Object<string, (string|undefined)>}
 */
const CHART_TYPES = {
  'area': 'AreaChart',
  'bar': 'BarChart',
  'md-bar': 'google.charts.Bar',
  'bubble': 'BubbleChart',
  'calendar': 'Calendar',
  'candlestick': 'CandlestickChart',
  'column': 'ColumnChart',
  'combo': 'ComboChart',
  'gauge': 'Gauge',
  'geo': 'GeoChart',
  'histogram': 'Histogram',
  'line': 'LineChart',
  'md-line': 'google.charts.Line',
  'org': 'OrgChart',
  'pie': 'PieChart',
  'sankey': 'Sankey',
  'scatter': 'ScatterChart',
  'md-scatter': 'google.charts.Scatter',
  'stepped-area': 'SteppedAreaChart',
  'table': 'Table',
  'timeline': 'Timeline',
  'treemap': 'TreeMap',
  'wordtree': 'WordTree',
};

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

@demo demo/index.html
*/
export class GoogleChart extends PolymerElement {
  static get template() {
    return html`
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

        /* Workaround for slow initial ready event for tables. */
        .google-visualization-table-loadtest {
          padding-left: 6px;
        }
      </style>
      <div id="styles"></div>
      <div id="chartdiv"></div>
    `;
  }

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
  static get properties() {
    return {
      type: {
        type: String,
        observer: GoogleChart.prototype._typeChanged,
      },
      events: Array,
      options: Object,
      cols: {
        type: Array,
        observer: GoogleChart.prototype._rowsOrColumnsChanged,
      },
      rows: {
        type: Array,
        observer: GoogleChart.prototype._rowsOrColumnsChanged,
      },
      data: {
        // Note: type: String, because it is parsed manually in the observer.
        type: String,
        observer: GoogleChart.prototype._dataChanged,
      },
      view: {
        type: Object,
        observer: GoogleChart.prototype._viewChanged,
      },
      selection: {
        type: Array,
        notify: true,
        observer: GoogleChart.prototype._setSelection,
      },
      drawn: {
        type: Boolean,
        readOnly: true,
      },
      _data: Object,
    };
  }

  static get observers() {
    return [
      'redraw(_data, options.*)',
    ];
  }

  constructor() {
    super();

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
     *
     * @type {string}
     */
    this.type = 'column';

    /**
     * Enumerates the chart events that should be fired.
     *
     * Charts support a variety of events. By default, this element only
     * fires on `ready` and `select`. If you would like to be notified of
     * other chart events, use this property to list them.
     * Events `ready` and `select` are always fired.
     *
     * Changes to this property are _not_ observed. Events are attached only
     * at chart construction time.
     *
     * @type {!Array<string>}
     */
    this.events = [];

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
    this.options = undefined;

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
    this.cols = undefined;

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
    this.rows = undefined;

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
    this.data = undefined;

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
    this.view = undefined;

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
    this.selection = undefined;


    /**
     * Whether the chart is currently rendered.
     *
     * @type {boolean}
     */
    this.drawn;
    this._setDrawn(false);

    /**
     * Internal data displayed on the chart.
     *
     * This property has protected visibility because it is used from an observer.
     *
     * @protected {!google.visualization.DataTable|
     *             !google.visualization.DataView|
     *             undefined}
     */
    this._data = undefined;

    /**
     * Internal chart object.
     * @private {!google.visualization.ChartWrapper|null}
     */
    this._chartWrapper = null;

    /** @private {?Debouncer} */
    this._redrawDebouncer = null;
  }

  /** @override */
  ready() {
    super.ready();
    createChartWrapper(this.$.chartdiv).then((chartWrapper) => {
      this._chartWrapper = chartWrapper;
      this._typeChanged();
      google.visualization.events.addListener(chartWrapper, 'ready', () => {
        this._setDrawn(true);
      });
      google.visualization.events.addListener(chartWrapper, 'select', () => {
        this.selection = chartWrapper.getChart().getSelection();
      });
      this._propagateEvents(DEFAULT_EVENTS, chartWrapper);
    });
  }

  /** Reacts to chart type change. */
  _typeChanged() {
    if (this._chartWrapper == null) return;
    this._chartWrapper.setChartType(CHART_TYPES[this.type] || this.type);
    const lastChart = this._chartWrapper.getChart();
    google.visualization.events.addOneTimeListener(this._chartWrapper, 'ready', () => {
      const chart = this._chartWrapper.getChart();
      if (chart !== lastChart) {
        this._propagateEvents(this.events.filter((eventName) => !DEFAULT_EVENTS.includes(eventName)), chart);
      }
      if (!this.$.styles.children.length) {
        this._localizeGlobalStylesheets();
      }
      if (this.selection) {
        this._setSelection();
      }
    });
    this.redraw();
  }

  /**
   * Adds listeners to propagate events from the chart.
   *
   * @param {!Array<string>} events
   * @private
   */
  _propagateEvents(events, eventTarget) {
    for (const eventName of events) {
      google.visualization.events.addListener(eventTarget, eventName, (event) => {
        this.dispatchEvent(new CustomEvent(`google-chart-${eventName}`, {
          bubbles: true,
          composed: true,
          detail: {
            chart: this._chartWrapper.getChart(),
            data: event,
          }}));
      });
    }
  }

  /** Sets the selectiton on the chart. */
  _setSelection() {
    if (this._chartWrapper == null) return;
    const chart = this._chartWrapper.getChart();
    if (chart == null) return;
    if (chart.setSelection) {
      // Workaround for timeline chart which emits select event on setSelection.
      // See issue #256.
      if (this.type === 'timeline') {
        const oldSelection = JSON.stringify(chart.getSelection());
        const newSelection = JSON.stringify(this.selection);
        if (newSelection === oldSelection) return;
      }
      chart.setSelection(this.selection);
    }
  }

  /**
   * Redraws the chart.
   *
   * Called automatically when data/type/selection attributes change.
   * Call manually to handle view updates, page resizes, etc.
   */
  redraw() {
    if (this._chartWrapper == null || this._data == null) return;
    this._chartWrapper.setDataTable(this._data);
    this._chartWrapper.setOptions(this.options || {});

    this._setDrawn(false);
    this._redrawDebouncer = Debouncer.debounce(this._redrawDebouncer, timeOut.after(5), () => {
      this._chartWrapper.draw();
    });
  }

  /**
   * Returns the chart serialized as an image URI.
   *
   * Call this after the chart is drawn (google-chart-ready event).
   *
   * @return {?string} Returns image URI.
   */
  get imageURI() {
    if (this._chartWrapper == null) return null;
    const chart = this._chartWrapper.getChart();
    return chart && chart.getImageURI();
  }

  /** Handles changes to the `view` attribute. */
  _viewChanged() {
    if (!this.view) { return; }
    this._data = this.view;
  }

  /** Handles changes to the rows & columns attributes. */
  async _rowsOrColumnsChanged() {
    const {rows, cols} = this;
    if (!rows || !cols) return;
    try {
      const dt = await dataTable({cols});
      dt.addRows(rows);
      this._data = dt;
    } catch (reason) {
      this.$.chartdiv.textContent = reason;
    }
  }

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
  _dataChanged(data) {
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
      dataPromise = fetch(data).then((response) => response.json());
    } else {
      // Data is all ready to be processed.
      dataPromise = Promise.resolve(data);
    }
    dataPromise.then(dataTable).then((data) => {
      this._data = data;
    });
  }

  /**
   * Queries global document head for google charts link#load-css-* and clones
   * them into the local root's div#styles element for shadow dom support.
   *
   * @private
   */
  _localizeGlobalStylesheets() {
    // get all gchart stylesheets
    var stylesheets = document.head
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

        this.$.styles.appendChild(clonedLinkEl);
      }
    }
  }
}

customElements.define('google-chart', GoogleChart);
