(() => {

/**
 * Supported chart type short hand values.
 * This value corresponds to what the `ChartWrapper` wants.
 * (The default namespace is `google.visualization`)
 * @enum {string}
 */
const ChartTypes = {
  'area': 'AreaChart',
  'area-stepped': 'SteppedAreaChart',
  'bar': 'BarChart',
  'bar-md': 'google.charts.Bar',
  'bubble': 'BubbleChart',
  'candlestick': 'CandlestickChart',
  'column': 'ColumnChart',
  'combo': 'ComboChart',
  'gantt': 'Gantt',
  'gauge': 'Gauge',
  'geo': 'GeoChart',
  'histogram': 'Histogram',
  'line': 'LineChart',
  'line-md': 'google.charts.Line',
  'org': 'OrgChart',
  'pie': 'PieChart',
  'sankey': 'Sankey',
  'scatter': 'ScatterChart',
  'scatter-md': 'google.charts.Scatter',
  'table': 'Table',
  'timeline': 'Timeline',
  'treemap': 'TreeMap',
  'wordtree': 'WordTree',
};

const loader = new GoogleChartLoader();

Polymer({
  is: 'google-chart',
  properties: {
    /**
     * The type of chart we should draw.
     * This can be a string in the `ChartTypes` object or any string corresponding to
     * a valid visualization name.
     * @type {string}
     * @attribute type
     */
    type: {
      type: String,
      value: 'column',
    },

    /**
     * The data we should draw.
     * This can be a `DataTable`, `DataView`, or a 2D Array.
     * @type {!DataTable|!Array<!Array>|undefined}
     * @attribute data
     */
    data: {
      type: Object,
      notify: true,
    },

    /**
     * The options to use when drawing the chart.
     * @type {!Object}
     * @attribute options
     */
    options: {
      type: Object,
      value: () => ({}),
    },

    /**
     * The current selection in the chart.
     * Not supported by all chart types (e.g. Gauge).
     * @type {!Array<{col:number,row:number}>}
     * @attribute selection
     */
    selection: {
      type: Array,
      notify: true,
      value: () => [],
    },

    /**
     * URL specifying the source of the data.
     * The response of this URL must conform to the
     * Chart Tools Datasource Protocol.
     * https://developers.google.com/chart/interactive/docs/dev/implementing_data_source
     * @type {string|undefined}
     * @attribute src
     */
    src: {
      type: String,
    },

    /**
     * Query for the datasource.
     * The format should match the Google Visualization Query Language.
     * https://developers.google.com/chart/interactive/docs/querylanguage
     * @type {string}
     * @attribute query
     */
    query: {
      type: String,
    },

    /**
     * List of actions to show in chart tooltips.
     * When an action is clicked, a `google-chart-action` event is fired.
     * The details of the event are simply the ID of the action.
     * Actions can be specified as either a object containing an `id` and `text`
     * or just as a string that will serve as both values.
     *
     * This property is observed for splice changes.
     *
     * Examples:
     *   actions='["Action Foo", {"id": "actionIdBar", "text": "Action Bar"}]'
     * @type {!Array<string|{id:string,text:string}>|undefined}
     * @attribute actions
     */
    actions: {
      type: Array,
      value: () => [],
    },

    /**
     * List of events to relay from the chart.
     * Different charts have different event types available.
     * Events `ready`, `select` and `error` are always relayed.
     * This property is not observed. Events are attached when the chart is created.
     *
     * Examples:
     *   events='["rollup", "mouseover"]'
     * @type {!Array<string>}
     * @attribute events
     */
    events: {
      type: Array,
      value: () => [],
    },

    /**
     * Indicates if the chart has finished drawing.
     * @type {boolean}
     * @attribute drawn
     */
    drawn: {
      type: Boolean,
      value: false,
      notify: true,
      readOnly: true,
    },

    /**
     * The error (if applicable) that occurred when drawing.
     * @type {!Object|undefined}
     * @attribute errors
     */
    error: {
      type: Object,
      notify: true,
      readOnly: true,
    },

    /**
     * View specification for the `ChartWrapper`.
     * @type {{columns:Array<number>,rows:Array<number>}}
     * @attribute view
     */
    view: {
      type: Object,
    },

    /**
     * Specifies the group for the chart in a Dashboard.
     * @type {string}
     * @attribute group
     */
    group: {
      type: String,
    },

    /**
     * Internal promise for creating a `ChartWrapper`.
     * Should not be used externally.
     * @type {!Promise<!google.visualization.ChartWrapper>}
     * @attribute wrapper
     */
    wrapper: {
      type: Object,
      readOnly: true,
      notify: true,
      computed: '_computeWrapper(type, options)',
    },
  },
  observers: [
    '_changeData(data)',
    '_changeOptions(options.*)',
    '_changeSrc(src, query)',
    '_changeView(view.*)',
    '_changeSelection(chart, selection.*)',
    '_changeActions(chart, actions.*)',
  ],
  listeners: {
    'google-chart-data-change': '_onDataChanged',
  },

  /** @type {!Array<string|{id:string,text:string}} actions attached to the chart */
  _attachedActions: [],

  /**
   * Trigger a draw on the wrapper.
   * Used internally and externally.
   * If there is neither a `DataTable` nor a `DataSourceUrl` set, this is a no-op.
   */
  draw() {
    if (!this.wrapper) {
      return;
    }
    this.debounce('draw', () => {
      this.wrapper.then(w => {
        if (w.getDataTable() || w.getDataSourceUrl()) {
          requestAnimationFrame(() => w.draw());
        }
      });
    });
  },

  /**
   * Execute a method on the chart object.
   * If the chart is not created, this is a no-op.
   * Otherwise, returns the value from the command.
   * 
   * Example:
   *   this.chart.execute('goUpAndDraw'); // For the TreeMap
   * @param {string} command the method to execute
   * @param {*} args variable arguments to pass to the method
   * @return {*} the result of executing the chart method
   */
  execute(command, ...args) {
    // We might want to rely on a promise for this.
    return this.drawn ? this.chart[command].apply(this.chart, args) : null;
  },

  /**
   * Get an image URI for the graph.
   * If the chart is not created, this is a no-op.
   * Otherwise, returns a string suitable for an img[src].
   * @return {string} the chart's image URI
   */
  get imageURI() {
    return this.drawn ? this.chart.getImageURI() : null;
  },

  /**
   * Adds an error to the chart.
   * @param {string} message the message to show
   * @param {string=} opt_detailedMessage the text to show in a tooltip
   * @param {!Object=} opt_options options for the error
   * @return {!Promise<string>} promise resolving to the string ID of the error
   */
  addError(message, opt_detailedMessage, opt_options) {
    return loader.visualization.then(v => v.errors.addError(
        this.$.chart, message, opt_detailedMessage, opt_options));
  },

  /**
   * Remove an error from the chart.
   * @param {string} id the ID of the error to remove
   * @returns {boolean} true if the error was removed
   */
  removeError(id) {
    // gviz removeError does not work in the shadow DOM.
    const error = this.root.getElementById(id);
    if (!error) {
      return false;
    }
    Polymer.dom(error.parentNode).removeChild(error);
    if (id == this.error.id) {
      delete this.error;
    }
    return true;
  },

  /**
   * Remove all errors from the chart.
   * @return {!Promise} resolves when the errors have been removed
   */
  removeAllErrors() {
    delete this.error;
    return loader.visualization.then(v => v.errors.removeAll(this.$.chart));
  },

  /**
   * Event listener for the `google-chart-data-changed` event.
   * This event is fired from nested `google-chart-data` and `google-chart-query` elements.
   * We stop propagation and use the data for display.
   * @param {!Event} evt the `google-chart-data-changed` event
   */
  _onDataChanged(evt) {
    // Nothing above us should interpret this event.
    evt.stopPropagation();
    this.data = evt.detail;
  },

  /**
   * Computes the `ChartWrapper` by the chart type.
   * @param {string} type the type of chart to draw, one of `ChartTypes` or freeform
   * @return {!Promise<!ChartWrapper>} the created `ChartWrapper`
   */
  _computeWrapper(type) {
    this._setDrawn(false);
    return loader.visualization.then(v => {
      const w = new v.ChartWrapper({
        chartType: ChartTypes[type] || type,
        container: this.$.chart,
        dataTable: this.data,
        dataSourceUrl: this.src,
        options: this.options,
        query: this.query,
        view: this.view,
      });
      v.events.addListener(w, 'ready', () => {
        this.chart = w.getChart();
        this._setDrawn(true);
        this.fire('google-chart-ready', this.chart);
      });
      v.events.addOneTimeListener(w, 'ready', () => {
        const c = w.getChart();
        this.events.forEach(evtType => {
          v.events.addListener(c, evtType, evt => {
            this.fire(`google-chart-${evtType}`, evt);
          });
        });
        // Don't move stylesheets if we're using the default (column) chart.
        // We probably don't need to move styles for a lot of charts...
        // TODO(wesalvaro): Maybe we can make this smarter.
        if (this.type != 'column') {
          loader.moveStyles(this);
        }
      });
      v.events.addListener(w, 'error', err => {
        this._setError(err);
        this.fire('google-chart-error', err);
      });
      v.events.addListener(w, 'select', () => {
        this._noReact = true;  // Don't echo selection
        this.selection = w.getChart().getSelection();
        this.fire('google-chart-select', this.selection);
      });
      return w;
    });
  },

  /**
   * Listens for changes in the selection to reflect them in the chart.
   * If we set the selection via an event from the chart, this should be a no-op.
   * If the chart does not support selection (e.g. Gauge), this is a no-op.
   * @param {!Chart} chart the chart object
   * @param {{base:!Array}} selectionSplice the selection change information
   */
  _changeSelection(chart, selectionSplice) {
    if (!chart) {
      return;
    }
    if (this._noReact) {
      this._noReact = false;
      return;
    }
    // Some charts do not support selection.
    if (chart.setSelection) {
      chart.setSelection(selectionSplice.base);
    }
  },

  /**
   * Listens for changes in the action list to reflect them in the chart.
   * If the chart does not support actions (e.g. Gauge), this is a no-op.
   * Adds/removes actions to reflect the array after splice changes.
   * @param {!Chart} chart the chart object
   * @param {!Object} actionSplice the selection change information
   */
  _changeActions(chart, actionsSplice) {
    if (!chart) {
      return;
    }
    if (!chart.setAction || !chart.removeAction) {
      return;
    }
    const actionId = a => String(a.id || a);
    const addAction = a => {
      const id = actionId(a);
      chart.setAction({
        id,
        text: String(a.text || a),
        action: () => this.fire('google-chart-action', id),
      });
    };
    const removeAction = a => chart.removeAction(actionId(a));
    switch(actionsSplice.path) {
      case 'actions':
        // Remove all current actions then add the new ones.
        this._attachedActions.forEach(removeAction);
        actionsSplice.base.forEach(addAction);
        break;
      case 'actions.splices':
        // We need to check the splices to only remove/add those changed.
        actionsSplice.value.indexSplices.forEach(s => {
          s.removed.forEach(removeAction);
          s.object.slice(s.index, s.index + s.addedCount).forEach(addAction);
        });
        break;
    }
    // Store current actions so we can remove them when the array is replaced
    this._attachedActions = actionsSplice.base; 
  },

  /**
   * @param {!Options} options the chart options
   */
  _changeOptions(optionsSlice) {
    if (!this.wrapper) {
      return;
    }
    this.wrapper.then(w => {
      w.setOptions(optionsSlice.base);
      this.draw();
    });
  },

  /**
   * Listens for changes in the view to reflect them in the chart.
   * @param {{base:!Array}} viewSplice the view change information
   */
  _changeView(viewSplice) {
    if (!this.wrapper) {
      return;
    }
    this.wrapper.then(w => {
      w.setView(viewSplice.base);
      this.draw();
    });
  },

  /**
   * Listens for changes to the data then reflects it in the chart.
   * This should override the Data Source specification.
   * @param {!DataTable|!Array<!Array>} data the new data to draw
   */
  _changeData(data) {
    if (!this.wrapper) {
      return;
    }
    this.wrapper.then(w => {
      w.setDataTable(data);
      this.draw();
    });
  },

  /**
   * Listens for changes to the query or data source URL then updates the chart.
   * Clears the `DataTable` first.
   * @param {string} src the data source URL
   * @param {string} query the data source query
   */
  _changeSrc(src, query) {
    if (!this.wrapper) {
      return;
    }
    this.wrapper.then(w => {
      w.setDataTable();
      w.setDataSourceUrl(src);
      if (query) {
        w.setQuery(query);
      }
      this.draw();
    });
  },
});

})();
