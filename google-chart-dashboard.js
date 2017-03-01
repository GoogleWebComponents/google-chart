Polymer({
  is: 'google-chart-dashboard',
  properties: {
    data: {
      type: Object,
    },
    charts: {
      type: Promise,
      readOnly: true,
    },
    controls: {
      type: Promise,
      readOnly: true,
    },
    dashboard: {
      type: Promise,
      readOnly: true,
    },
    bound: {
      type: Object,
      computed: '_computeBound(dashboard, controls, charts, data)',
    },
    selection: {
      type: Array,
      readOnly: true,
      value: () => [],
    },
  },
  listeners: {
    'google-chart-data-change': '_onDataChanged',
    'google-chart-select': '_onSelectChanged',
  },
  observers: [
    '_drawDashboard(dashboard, data, bound)',
  ],
  attached() {
    const $ = q => Polymer.dom(this).querySelectorAll(q);
    this._setCharts($('google-chart'));
    this._setControls($('google-chart-control'));
    this._setDashboard(this._v.then(v => new v.Dashboard(this.$.dashboard)));
  },
  _v: new GoogleChartLoader(['controls']).visualization,
  _onDataChanged(evt) {
    evt.stopPropagation();
    this.data = evt.detail;
  },
  _onSelectChanged(evt) {
    evt.stopPropagation();
    this.dashboard.then(d => {
      this._setSelection(d.getSelection());
      this.fire('google-chart-select', this.selection, {node: this.parentNode});
    });
  },
  _computeBound(dashboard, controls, charts, data) {
    return Promise.all([
      dashboard,
      Promise.all(controls.map(x => x.wrapper)),
      Promise.all(charts.map(x => x.wrapper)),
    ]).then(pp => {
      const groups = {};
      const getGroup = id => {
        id = id || '__DEFAULT';
        if (!groups[id]) {
          groups[id] = {controls:[], charts:[]};
        }
        return groups[id];
      };
      const dashboard = pp[0];
      console.log('binding', pp);
      pp[1].forEach(control =>  getGroup(control.group).controls.push(control));
      pp[2].forEach(chart =>  getGroup(chart.group).charts.push(chart));
      for (const id in groups) {
        const group = groups[id];
        if (group.controls.length && group.charts.length) {
          dashboard.bind(group.controls, group.charts);
        } else {
          group.charts.forEach(w => {
            w.setDataTable(data);
            w.draw();
          });
        }
      }
      dashboard.draw(data);
      console.log('bound');
    });
  },
  _drawDashboard(dashboard, data, bound) {
    if (!bound) {
      return;
    }
    //dashboard.then(d => d.draw(data));
  },
});
