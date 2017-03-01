Polymer({
  is: 'google-chart-query',
  properties: {
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
      value: '',
    },
    /**
     * This specifies that a `DataView` should be created.
     * This value should be the result of the `DataView.toJSON` method.
     * To simply have `data` be a `DataView` instead of a `DataTable`,
     * set this to '{}'.
     * This propertiy is observed for splice changes.
     * @type {?Object}
     * @attribute view
     */
    view: {
      type: Object,
      value: null,
    },
    /**
     * The main data property of the element.
     * Can be either a `DataTable` or a `DataView` if `view` is set.
     * @type {?google.visualization.IDataTable}
     * @attribute data
     */
    data: {
      type: Object,
      readOnly: true,
      notify: true,
    },
    /**
     * This value is always a `DataTable`.
     * This value is computed from either the:
     *   `value` or `rows` and `columns` properties.
     * @type {?google.visualization.DataTable}
     * @attribute table
     */
    table: {
      type: Object,
      notify: true,
      readOnly: true,
    },
  },
  observers: [
    '_computeData(src,query,view)',
  ],
  hostAttributes: {
    hidden: true,
  },
  _v: new GoogleChartLoader().visualization,
  /**
   * Compute the data and the table.
   * @param {string} src the datasource
   * @param {string} query the query for the datasource
   * @param {?Object} view the `DataView` configuration
   */
  _computeData(src, query, view) {
    this._v.then(v => {
      const request = new v.Query(src);
      if (query) {
        request.setQuery(query);
      }
      request.send(response => {
        this._setTable(response.getDataTable());
        this._setData(
            view ? v.DataView.fromJSON(this.table, view) : this.table);
        this.fire('google-chart-data-change', this.data);
      });  
    });
  }
});
