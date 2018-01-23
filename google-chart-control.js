(() => {

/**
 * Supported control type short hand values.
 * @enum {string}
 */
const ControlTypes = {
  'category': 'CategoryFilter',
  'filter': 'StringFilter',
  'range': 'NumberRangeFilter',
  'range-chart': 'ChartRangeFilter',
  'range-date': 'DateRangeFilter',
};

const loader = new GoogleChartLoader(['controls']);

Polymer({
  is: 'google-chart-control',
  properties: {
    /**
     * The type of control we should draw.
     * This can be a string in the `ControlTypes` object or any string corresponding to
     * a valid control name.
     * @type {string}
     * @attribute type
     */
    type: {
      type: String,
      value: 'range',
    },
    /**
     * The options of the specific control.
     * @type {!Object}
     * @attribute options
     */
    options: {
      type: Object,
      value: () => ({}),
    },
    /**
     * The state of the specific control.
     * @type {Object|undefined}
     * @attribute state
     */
    state: {
      type: Object,
      notify: true,
    },
    /**
     * True when the control has been drawn and is ready for interaction.
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
     * The label of the column in the data to control.
     * Either `label` or `index` should be set, not both.
     * @type {string}
     * @attribute label
     */
    label: {
      type: String,
      value: null,
      observer: '_labelChanged',
    },
    /**
     * The index of the column in the data to control.
     * Either `label` or `index` should be set, not both.
     * @type {number}
     * @attribute index
     */
    index: {
      type: Number,
      value: -1,
      observer: '_indexChanged',
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
      type: String,
      readOnly: true,
      notify: true,
      computed: '_computeWrapper(type)',
    },
  },
  observers: [
    '_draw(options.*)',
    '_draw(state.*)',
  ],

  /**
   * Update the options with the index properties.
   * Only one of index or label should be set.
   * @param {number} index the column index to control
   */
  _indexChanged(index) {
    this.set('options.filterColumnIndex', index >= 0 ? index : undefined);
  },

  /**
   * Update the options with the label properties.
   * Only one of index or label should be set.
   * @param {?string} label the column label to control
   */
  _labelChanged(label) {
    this.set('options.filterColumnLabel', label || undefined);
  },

  _draw() {
    if (!this.drawn || !this.wrapper || this._dontReact) {
      this._dontReact = false;
      return;
    }
    this.wrapper.then(w => {
      requestAnimationFrame(() => {
        w.setState(this.state);
        w.setOptions(this.options);
        w.draw();
      });
    });
  },

  /**
   * Creates a `ControlWrapper` for the specified `type`.
   * @param {string} type the type of the `Control`
   * @return {!Promise<!google.visualization.ControlWrapper>}
   */
  _computeWrapper(type) {
    this._setDrawn(false);
    return loader.visualization.then(v => {
      const w = new v.ControlWrapper({
        'controlType': ControlTypes[this.type] || this.type,
        'container': this.$.control,
        'options': this.options,
        'state': this.state ,
      });
      v.events.addOneTimeListener(w, 'ready', () => {
        this._dontReact = true;
        loader.moveStyles(this);
        this._setDrawn(true);
        this.state = w.getState();
        this.fire('google-chart-ready', w.getControl());
        // We draw it a second time so that the ranges render correctly...
        this._draw();
      });
      v.events.addListener(w, 'statechange', () => {
        this._dontReact = true;
        this.state = w.getState();
        this.fire('google-chart-statechange', this.state);
      });
      return w;
    });
  },
});

})();
