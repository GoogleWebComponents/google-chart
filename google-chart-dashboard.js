(() => {

const loader = new GoogleChartLoader(['controls']);

Polymer({
  is: 'google-chart-dashboard',
  properties: {
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
     * The current selection in the dashboard.
     * @type {!Array<{col:number,row:number}>}
     * @attribute selection
     */
    selection: {
      type: Array,
      notify: true,
      readOnly: true,
      value: () => [],
    },

    /**
     * Indicates if the dashboard has finished drawing.
     * @type {boolean}
     * @attribute drawn
     */
    drawn: {
      type: Boolean,
      notify: true,
      readOnly: true,
      value: false,
    },

    /**
     * Whether the dashboard has been bound.
     * @type {!Promise}
     * @attribute wrappers
     */
    bound: {
      type: Boolean,
      readOnly: true,
      value: false,
    },

    /**
     * Internal promise for the `Dashboard` creation.
     * @type {!Promise<!google.visualization.Dashboard>}
     * @attribute dashboard
     */
    dashboard: {
      type: Object,
      readOnly: true,
    },

    /**
     * Internal object tracking the chart and control groups.
     * @type {!Object<string, {
     *     controls: !Array<!Element>,
     *     charts: !Array<!Element>}>}
     * @attribute groups
     */
    groups: {
      type: Object,
      readOnly: true,
    },
  },

  listeners: {
    'google-chart-data-change': '_onDataChanged',
    'google-chart-select': '_onSelectChanged',
  },
  observers: [
    '_bindDashboard(dashboard, groups)',
    '_drawInitialDashboard(bound, data)',
  ],
  _uncontrolledCharts: [],

  /**
   * Let's iterate through all the charts and controls, building their bind groups.
   * Those without a specified group are put into a default group.
   * @return {!Object<string, {
   *     controls: !Array<!Element>,
   *     charts: !Array<!Element>}>}
   */
  _createGroups() {
    const $ = q => Polymer.dom(this).querySelectorAll(q);
    const groups = {};
    const getGroup = id => {
      id = id || '__DEFAULT';
      if (!groups[id]) {
        groups[id] = {controls:[], charts:[]};
      }
      return groups[id];
    };
    const wrapper = el => new Promise(resolve => {
      const wrapperChanged = () => {
        resolve(el);
        el.removeEventListener('wrapper-changed', wrapperChanged);
      };
      el.addEventListener('wrapper-changed', wrapperChanged);
    });
    $('google-chart-control').forEach(
        control => getGroup(control.group).controls.push(wrapper(control)));
    $('google-chart').forEach(
        chart => getGroup(chart.group).charts.push(wrapper(chart)));
    return groups;
  },

  /**
   * After the dashboard is attached, we can start looking for charts and controls.
   * We'll go ahead and create the Dashboard, too.
   */
  attached() {
    this._setGroups(this._createGroups());
    this._setDashboard(loader.visualization.then(v => new v.Dashboard(this.$.dashboard)));
  },

  /**
   * Once we have the groups of charts and controls, we need to bind them wrappers.
   * For each group, if we have at least one chart and control, we're good.
   * If there are no controls in a group, add the chart to the uncontrolled list.
   *   (These charts will get the full dataset to be drawn with, later.)
   * If there are no charts in a group, set the `unconnected` class on the control.
   *   (The styling for unconnected controls will hide them.)
   * @param {!google.visualization.Dashboard} dashboard
   * @param {!Object<string, {
   *    controls: !Array<!Promise<!Element>>,
   *    charts: !Array<!Promise<!Element>}>>} groups the chart and control binding groups
   * @return {!Array<!Promise>>} a promise for the completed binding phase
   */
  _bindDashboard(dashboard, groups) {
    if (!dashboard || !groups) {
      return;
    }
    const wrappers = [];
    for (const id in groups) {
      const group = groups[id];
      Promise.all([Promise.all(group.charts), Promise.all(group.controls)]).then(cc => {
        const [charts, controls] = cc;
        // Bind controls charts if the are specified
        if (charts.length && controls.length) {
          // We need to resolve the dashboard and all the wrappers before binding.
          wrappers.push(Promise.all([
            Promise.all(controls.map(c => c.wrapper)),
            Promise.all(charts.map(c => c.wrapper)),
          ]));
        } else if (charts.length) {
          this._uncontrolledCharts.push(...charts);
        } else if (controls.length) {
          // Add the class `unconnected` to unconnected controls.
          // `google-chart-control` should hide itself when this class is added.
          controls.forEach(c => {
            Polymer.dom(c).classList.add('unconnected');
          });
        }
      });
    }
    Promise.all([dashboard, wrappers]).then(dww => {
      const [d, ww] = dww;
      return Promise.all(ww.map(w => w.then(cc => d.bind(cc[0], cc[1]))));
    }).then(() => this._setBound(true));
  },

  /**
   * Bindings are configured, now we need to draw data changes.
   * For all the uncontrolled charts, just set the data on them.
   * @param {!Promise<!google.visualization.Dashboard>} dashboard
   * @param {!Promise} a promise for the completed binding phase
   * @param {!google.visualization.DataTable}
   */
  _drawInitialDashboard(bound, data) {
    if (!bound || !data) {
      return;
    }
    this._setDrawn(false);
    this._uncontrolledCharts.forEach(c => {
      c.data = data;
    });
    this.dashboard.then(d => {
      d.draw(data);
      this._setDrawn(true);
    });
  },

  /**
   * Handle data updates fired from within the dashboard.
   * We'll stop it because no other element should be interested.
   * @param {!Event} evt the `google-chart-data-change` event
   */
  _onDataChanged(evt) {
    evt.stopPropagation();
    this.data = evt.detail;
  },

  /**
   * Stop and re-fire the select event in the context of the dashboard.
   * Chart select events are different from a dashboard.
   * (they are based on the chart's data slice, not the full dataset)
   * If someone is listening for a select on the Dashboard, they should get
   * a reference to the Dashboard's dataset.
   * If the select event comes from an uncontrolled chart,
   * the selection value will remain unchanged.
   * @param {!Event} evt the `google-chart-select` event
   */
  _onSelectChanged(evt) {
    evt.stopPropagation();
    this.dashboard.then(d => {
      this._setSelection(d.getSelection());
      this.fire('google-chart-select', this.selection, {node: this.parentNode});
    });
  },
});

})();
