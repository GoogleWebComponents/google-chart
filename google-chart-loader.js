/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at https://polymer.github.io/LICENSE.txt
The complete set of authors may be found at https://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at https://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at https://polymer.github.io/PATENTS.txt
*/
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { load, dataTable } from './loader.js';

/** @type {string} Most charts use this package. */
var DEFACTO_CHART_PACKAGE = 'corechart';

/** @enum {string} Namespaces that contain chart constructors. */
var Namespace = {
  CHARTS: 'charts',
  VIS: 'visualization'
};

/**
 * A collection of chart type details.
 *
 * @type {!Object<string, {ctor: string, namespace: (!Namespace|undefined), pkg: (string|undefined)}>}
 */
var CHART_CONSTRUCTORS = {
  'area': {
    ctor: 'AreaChart',
  },
  'bar': {
    ctor: 'BarChart',
  },
  'md-bar': {
    ctor: 'Bar',
    pkg: 'bar',
  },
  'bubble': {
    ctor: 'BubbleChart',
  },
  'calendar': {
    ctor: 'Calendar',
    pkg: 'calendar',
  },
  'candlestick': {
    ctor: 'CandlestickChart',
  },
  'column': {
    ctor: 'ColumnChart',
  },
  'combo': {
    ctor: 'ComboChart',
  },
  'gauge': {
    ctor: 'Gauge',
    pkg: 'gauge',
  },
  'geo': {
    ctor: 'GeoChart',
  },
  'histogram': {
    ctor: 'Histogram',
  },
  'line': {
    ctor: 'LineChart',
  },
  'md-line': {
    ctor: 'Line',
    pkg: 'line',
  },
  'org': {
    ctor: 'OrgChart',
    pkg: 'orgchart',
  },
  'pie': {
    ctor: 'PieChart',
  },
  'sankey': {
    ctor: 'Sankey',
    pkg: 'sankey',
  },
  'scatter': {
    ctor: 'ScatterChart',
  },
  'md-scatter': {
    ctor: 'Scatter',
    pkg: 'scatter',
  },
  'stepped-area': {
    ctor: 'SteppedAreaChart',
  },
  'table': {
    ctor: 'Table',
    pkg: 'table',
  },
  'timeline': {
    ctor: 'Timeline',
    pkg: 'timeline',
  },
  'treemap': {
    ctor: 'TreeMap',
    pkg: 'treemap',
  },
  'wordtree': {
    ctor: 'WordTree',
    namespace: Namespace.VIS,
    pkg: 'wordtree',
  }
};

/**
 * The Google Charts constructor namespace inferred from the given chart type.
 * @param {string} type the type of the chart
 * @return {!Object} the namespace that contains the chart's constructor
 */
function namespaceForType(type) {
  return google[type.indexOf('md-') === 0 ? Namespace.CHARTS : Namespace.VIS];
}

/** @type {!Object<string, boolean>} set-like object of gviz packages to load */
var packagesToLoad = {};
/** @type {!Object<string, !Promise>} promises for the various packages */
var promises = {};
/** @type {!Object<string, function(!Object)>} resolves for the package promises */
var resolves = {};

/**
 * GoogleChartLoader is a wrapper around Google Charts package loading API.
 *
 * @deprecated Use `loader.js` or ChartWrapper directly instead. This element
 *     will be removed in the next release.
 */
Polymer({
  is: 'google-chart-loader',
  properties: {
    /**
     * Adds packages to the list of packages to load.
     *
     * This is an array consisting of any Google Visualization package names.
     *
     * @type {!Array<string>}
     */
    packages: {
      type: Array,
      value: function() { return []; },
      observer: '_loadPackages',
    },
    /**
     * Loads the package for the chart type specified.
     *
     * This may be any of the supported `google-chart` types.
     * This is mainly used by the `google-chart` element internally.
     *
     * @type {string}
     */
    type: {
      type: String,
      observer: '_loadPackageForType',
    },
  },

  /**
   * Gets a promise for the `corechart` package being loaded.
   * @return {!Promise<!Object>} google.visualization package promise
   * @private
   */
  get _corePackage() {
    if (promises[DEFACTO_CHART_PACKAGE]) {
      return promises[DEFACTO_CHART_PACKAGE];
    }
    return this._loadPackages([DEFACTO_CHART_PACKAGE]).then(function(pkgs) {
      return pkgs[0];
    });
  },

  /**
   * Debounces the actual call to load the packages requested.
   * We debounce so that load is only called once.
   * @private
   */
  _loadPackagesDebounce: function() {
    this.debounce('loadPackages', () => {
      var packages = Object.keys(packagesToLoad);
      if (!packages.length) {
        return;
      }
      packagesToLoad = {};
      load({packages}).then(() => {
        packages.forEach((pkg) => {
          this.fire('loaded', pkg);
          resolves[pkg](google.visualization);
        });
      });
    }, 100);
  },

  /**
   * Adds a list of packages to load.
   *
   * @param {!Array<string>} pkgs list of packages to load
   * @return {!Promise} Promise resolved when all packages are loaded
   * @private
   */
  _loadPackages: function(pkgs) {
    var returns = [];
    pkgs.forEach(function(pkg) {
      if (!promises[pkg]) {
        packagesToLoad[pkg] = true;
        promises[pkg] = new Promise(function(resolve) {
          resolves[pkg] = resolve;
        });
        this._loadPackagesDebounce();
      }
      returns.push(promises[pkg]);
    }.bind(this));
    return Promise.all(returns);
  },

  /**
   * Adds a package to load for the given type.
   *
   * @param {string} type the chart type for which we should load the package
   * @return {!Promise<!Function>} Promise for the chart type constructor
   * @private
   */
  _loadPackageForType: function(type) {
    var chartData = CHART_CONSTRUCTORS[type];
    if (!chartData) {
      return Promise.reject(
          'This chart type is not yet supported: ' + type);
    }
    return this._loadPackages([chartData.pkg || DEFACTO_CHART_PACKAGE])
      .then(function() {
        var namespace = google[chartData.namespace] || namespaceForType(type);
        return namespace[chartData.ctor];
      });
  },

  /**
   * Creates a chart object by type in the specified element.
   * Use *only* if you need total control of a chart object.
   * Most should just use the `google-chart` element.
   *
   * @param {string} type the type of chart to create
   * @param {!Element} el the element in which to create the chart
   * @return {!Promise<!Object>} promise for the created chart object
   * @override
   * @suppress {checkTypes} This function accidentally overrides `create` from
   *     Polymer_LegacyElementMixin.
   */
  create: function(type, el) {
    return this._loadPackageForType(type).then(function(ctor) {
      return new ctor(el);
    });
  },

  /**
   * Begins firing Polymer events for the requested chart event.
   * Use *only* if you have control of a chart object.
   * Most should just use the `google-chart` element.
   *
   * Events fired all have the same detail object:
   *   {{
   *     chart: !Object,  // The chart target object
   *     data: (Object|undefined),  // The chart event details
   *   }}
   *
   * @param {!Object} chart the chart object to which we should listen
   * @param {string} eventName the name of the chart event
   * @param {boolean=} opt_once whether to listen only one time
   * @return {!Promise<void>} promise resolved when listener is attached
   */
  fireOnChartEvent: function(chart, eventName, opt_once) {
    return this._corePackage.then(function(viz) {
      var adder = opt_once ?
          viz.events.addOneTimeListener : viz.events.addListener;
      adder(chart, eventName, function(event) {
        this.fire('google-chart-' + eventName, {
          chart: chart,
          data: event,
        });
      }.bind(this));
    }.bind(this));
  },

  /**
   * Creates a DataTable object for use with a chart.
   *
   * Multiple different argument types are supported. This is because the
   * result of loading the JSON data URL is fed into this function for
   * DataTable construction and its format is unknown.
   *
   * The data argument can be one of a few options:
   *
   * - null/undefined: An empty DataTable is created. Columns must be added
   * - !DataTable: The object is simply returned
   * - {{cols: !Array, rows: !Array}}: A DataTable in object format
   * - {{cols: !Array}}: A DataTable in object format without rows
   * - !Array<!Array>: A DataTable in 2D array format
   *
   * Un-supported types:
   *
   * - Empty !Array<!Array>: (e.g. `[]`) While technically a valid data
   *   format, this is rejected as charts will not render empty DataTables.
   *   DataTables must at least have columns specified. An empty array is most
   *   likely due to a bug or bad data. If one wants an empty DataTable, pass
   *   no arguments.
   * - Anything else
   *
   * See <a href="https://developers.google.com/chart/interactive/docs/reference#datatable-class">the docs</a> for more details.
   *
   * @param {!Array|{cols: !Array, rows: (!Array<!Array>|undefined)}|undefined} data
   *     the data with which we should use to construct the new DataTable object
   * @return {!Promise<!google.visualization.DataTable>} promise for the created DataTable
   */
  dataTable: function(data) {
    return dataTable(data);
  },

  /**
   * Creates a DataView object from a DataTable for use with a chart.
   *
   * See <a href="https://developers.google.com/chart/interactive/docs/reference#dataview-class">the docs</a> for more details.
   *
   * @param {!google.visualization.DataTable} data the DataTable to use
   * @return {!Promise<!google.visualization.DataView>} promise for the created DataView
   */
  dataView: function(data) {
    return this._corePackage.then(function(viz) {
      return new viz.DataView(data);
    });
  },

  /**
   * Creates a Query object to be sent to a DataSource protocol implementation.
   *
   * See <a href="https://developers.google.com/chart/interactive/docs/reference#query-classes">the docs</a> for more details.
   *
   * @param {string} url the URL of the DataSource protocol implementer
   * @param {!Object=} opt_options options for the Query object
   * @return {!Promise<!google.visualization.Query>} promise for the created DataView
   */
  query: function(url, opt_options) {
    return this._corePackage.then(function(viz) {
      return new viz.Query(url, opt_options);
    });
  }
});
