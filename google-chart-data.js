Polymer({
  is: 'google-chart-data',
  properties: {
    /**
     * The main data property of the element.
     * Can be either a `DataTable` or a `DataView` if `view` is set.
     * @type {?google.visualization.IDataTable}
     * @attribute data
     */
    data: {
      type: Object,
      notify: true,
      readOnly: true,
      observer: '_onDataChanged'
    },
    /**
     * Can be either a 2D-`Array` or `Object` `DataTable` format.
     * @type {(Array<Array>|Object)}
     * @attribute value
     */
    value: {
      type: Array,
    },
    /**
     * An array specifying the column definitions.
     * This should only be used with `rows`, not `value`.
     * @type {Array<Object>}
     * @attribute cols
     */
    cols: {
      type: Array,
    },
    /**
     * A 2D-array specifying the row data.
     * This should only be used with `cols`, not `value`.
     * @type {Array<Array<*>>}
     * @attribute rows
     */
    rows: {
      type: Array,
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
    '_computeData(table, view.*)',
    '_computeTableFromValue(value.*)',
    '_computeTableFromRowsAndColumns(rows.*, cols.*)',
  ],
  hostAttributes: {
    hidden: true,
  },
  factoryImpl: function(opt_value_or_cols, opt_rows) {
    if (opt_rows) {
      this.cols = opt_value_or_cols;
      this.rows = opt_rows;
    } else {
      this.value = opt_value_or_cols;
    }
  },
  _v: new GoogleChartLoader().visualization,
  _onDataChanged(data) {
    this.fire('google-chart-data-change', data);
  },
  _computeData(table, viewSplice) {
    if (!table) {
      return;
    }
    const view = viewSplice.base;
    if (view) {
      this._v.then(v => new v.DataView.fromJSON(table, view)).then(view => this._setData(view));
    } else {
      this._setData(table);
    }
  },
  _computeTableFromRowsAndColumns(rowsSplice, colsSplice) {
    const rows = rowsSplice.base || [];
    const cols = colsSplice.base;
    this.debounce('updateDataTable', () => {
      this._v.then(v => {
        const table = new v.DataTable();
        cols.forEach(function(col) {
          table.addColumn(col);
        });
        table.addRows(rows);
        this._setTable(table);
      });
    });
  },
  _computeTableFromValue(valueSplice) {
    const value = valueSplice.base;
    this.debounce('updateDataTable', () => {
      this._v.then(v => {
        let table;
        if (!value) {
          // pass
        } else if (value.cols) {
          table = new v.DataTable(value);
        } else {
          table = v.arrayToDataTable(value);
        }
        this._setTable(table);
      });
    }, 0);
  }
});
