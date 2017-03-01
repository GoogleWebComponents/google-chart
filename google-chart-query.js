Polymer({
  is: 'google-chart-query',
  properties: {
    src: {
      type: String,
    },
    query: {
      type: String,
    },
    data: {
      type: Object,
      readOnly: true,
      notify: true,
    },
    view: {
      type: Object,
      value: null,
    },
  },
  observers: [
    '_computeData(src,query,view)',
  ],
  _v: new GoogleChartLoader().visualization,
  _computeData(src, query, view) {
    return this._v.then(v => {
      const request = new v.Query(src);
      if (query) {
        request.setQuery(query);
      }
      request.send(response => {
        let data = response.getDataTable();
        if (view) {
          data = v.DataView.fromJSON(data, view);
        }
        this._setData(data);
        this.fire('google-chart-data-change', data);
        return data;
      });  
    });
  }
});
