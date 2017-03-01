Polymer({
  is: 'google-chart-data',
  properties: {
    data: {
      type: Object,
      notify: true,
      readOnly: true,
      observer: '_onDataChanged'
    },
    value: {
      type: Array,
    },
    cols: {
      type: Array,
    },
    rows: {
      type: Array,
    },
    view: {
      type: Object,
      value: null,
    },
    table: {
      type: Object,
      readOnly: true,
    },
  },
  observers: [
    '_computeData(table, view.*)',
    '_computeTableFromValue(value.*)',
    '_computeTableFromRowsAndColumns(rows.*, cols.*)',
  ],
  hostAttributes: {
    hidden: true
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
    const view = viewSplice.base;
    if (view) {
      this._v.then(v => new v.DataView.fromJSON(table, view)).then(view => this._setData(view));
    } else {
      this._setData(table);
    }
  },
  _computeTableFromRowsAndColumns(rowsSplice, colsSplice) {
    const rows = rowsSplice.base;
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
