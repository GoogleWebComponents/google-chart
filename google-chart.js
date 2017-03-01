(() => {
  
const ChartTypes = {
  'area': 'AreaChart',
  'area-stepped': 'SteppedAreaChart',
  'bar': 'BarChart',
  'bar-md': 'google.charts.Bar',
  'bubble': 'BubbleChart',
  'candlestick': 'CandlestickChart',
  'column': 'ColumnChart',
  'combo': 'ComboChart',
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
     * @property
     */
    type: {
      type: String,
      observer: '_typeChanged',
      value: 'column',
    },
    /**
     * The data we should draw.
     * This can be a `DataTable` or a 2D Array.
     * @type {!DataTable|!Array<!Array>|undefined}
     * @property
     */
    data: {
      type: Object,
      notify: true,
    },
    /**
     * The options to use when drawing the chart.
     * @type {!Object}
     * @property
     */
    options: {
      type: Object,
      value: () => ({}),
    },
    /**
     * The current selection in the chart.
     * Not supported by all chart types (e.g. Gauge).
     * @type {!Array<{col:number,row:number}>}
     * @property
     */
    selection: {
      type: Array,
      notify: true,
      value: () => [],
    },
    /**
     * The data source URL to use for a query.
     * @type {string|undefined}
     * @property
     */
    src: {
      type: String,
    },
    /**
     * The data source query.
     * @type {string}
     * @property
     */
    query: {
      type: String,
      value: '',
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
     * @property
     */
    actions: {
      type: Array,
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
     * @property
     */
    events: {
      type: Array,
      value: () => [],
    },
    /**
     * Indicating that the chart has finished drawing.
     * @type {boolean}
     * @property
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
     * @property
     */
    error: {
      type: Object,
      notify: true,
      readOnly: true,
    },
    /**
     * View specification for the `ChartWrapper`.
     * @type {{columns:Array<number>,rows:Array<number>}}
     * @property
     */
    view: {
      type: Object,
    },
    /**
     * Specifies the group for the chart in a Dashboard.
     * @type {string}
     * @property
     */
    group: {
      type: String,
    },
    /**
     * Internal promise for creating a `ChartWrapper`.
     * Should not be used externally.
     * @type {!Promise<!ChartWrapper>}
     * @property
     */
    wrapper: {
      type: Object,
      readOnly: true,
      computed: '_computeWrapper(type, options)',
    },
  },
  observers: [
    '_changeData(wrapper,data)',
    '_changeSrc(wrapper,src,query)',
    '_changeView(wrapper,view.*)',
    '_changeSelection(chart,selection.*)',
    '_changeActions(chart,actions.*)',
  ],
  listeners: {
    'google-chart-data-change': '_onDataChanged',
  },
  /** @type {!Array<string|{id:string,text:string}} actions attached to the chart */
  _attachedActions: [],
  /** @type {boolean} true if we are in the shadow DOM and the `type` changes */
  _maybeNeedStyles: false,
  /**
   * Trigger a draw on the wrapper.
   * Used internally and externally.
   * If there is neither a `DataTable` nor a `DataSourceUrl` set, this is a no-op.
   * Debounced.
   */
  draw() {
    this.debounce('draw', () => this.wrapper.then(w => {
      if (w.getDataTable() || w.getDataSourceUrl()) {
        w.draw();
      }
    }), 0);
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
   * Property observer for `type` so we can re-import visual styles.
   * We only need to re-import styles if we are using shadow DOM.
   */
  _typeChanged() {
    // When the type is changed, we may need new styles.
    this._maybeNeedStyles = !!this.shadowRoot;
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
   * Computes the `ChartWrapper` with the chart type and options.
   * @param {string} type the type of chart to draw, one of `ChartTypes` or freeform
   * @param {!Options} options the chart options
   * @return {!Promise<!ChartWrapper>} the created `ChartWrapper`
   */
  _computeWrapper(type, options) {
    this.drawn = false;
    return loader.visualization.then(v => {
      const w = new v.ChartWrapper({
        chartType: ChartTypes[type] || type,
        options: options,
        container: this.$.chart,
      });
      v.events.addListener(w, 'ready', evt => {
        const c = w.getChart();
        this.events.forEach(evtType => {
          v.events.addListener(c, evtType, evt => {
            this.fire(`google-chart-${evtType}`, evt);
          });
        });
        if (this._maybeNeedStyles) {
          loader.moveStyles(this.shadowRoot);
          this._maybeNeedStyles = false;
        }
        this.chart = c;
        this._setDrawn(true)
        this.fire('google-chart-ready', c);
      });
      v.events.addListener(w, 'error', err => {
        this._setError(err);
        this.fire('google-chart-ready', err);
      });
      v.events.addListener(w, 'select', evt => {
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
   * Listens for changes in the view to reflect them in the chart.
   * @param {!Promise<!ChartWrapper>} wrapper the ChartWrapper to modify
   * @param {{base:!Array}} viewSplice the view change information
   */
  _changeView(wrapper, viewSplice) {
    wrapper.then(w => {
      w.setView(viewSplice.base);
      this.draw();
    });
  },
  /**
   * Listens for changes to the data then reflects it in the chart.
   * This should override the Data Source specification.
   * @param {!Promise<!ChartWrapper>} wrapper the ChartWrapper to modify
   * @param {!DataTable|!Array<!Array>} data the new data to draw
   */
  _changeData(wrapper, data) {
    wrapper.then(w => {
      w.setDataTable(data);
      this.draw();
    });
  },
  /**
   * Listens for changes to the query or data source URL then updates the chart.
   * Clears the `DataTable` first.
   * @param {!Promise<!ChartWrapper>} wrapper the ChartWrapper to modify
   * @param {string} src the data source URL
   * @param {string} query the data source query
   */
  _changeSrc(wrapper, src, query) {
    wrapper.then(w => {
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
