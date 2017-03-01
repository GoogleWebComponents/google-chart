(() => {

const controlTypes = {
  'range': 'NumberRangeFilter',
};

const loader = new GoogleChartLoader(['controls']);

Polymer({
  is: 'google-chart-control',
  properties: {
    'wrapper': {
      type: String,
      readOnly: true,
      computed: '_computeWrapper(type)',
    },
    'type': {
      type: String,
      value: 'range',
      observer: '_typeChanged',
    },
    'options': {
      type: Object,
      value: () => ({}),
    },
    'group': {
      type: String,
    },
    'state': {
      type: Object,
      value: () => ({}),
    },
    'label': {
      type: String,
      value: null,
    },
    'index': {
      type: Number,
      value: -1,
    },
  },
  observers: [
    '_computeOptions(wrapper, options.*, index, label)',
    '_computeState(wrapper, state.*)',
  ],
  _maybeNeedStyles: false,
  _typeChanged() {
    this._maybeNeedStyles = !!this.shadowRoot;
  },
  _computeState(wrapper, stateSplice) {
    wrapper.then(w => {
      w.setState(stateSplice.base);
    });
  },
  _computeOptions(wrapper, optionsSplice, index, label) {
    if (this._noReact) {
      return;
    }
    const options = optionsSplice.base;
    this._noReact = true;  // Ignore splice changes here.
    options.filterColumnLabel = label || undefined;
    options.filterColumnIndex = index >= 0 ? index : undefined;
    this._noReact = false;
    wrapper.then(w => {
      w.setOptions(options);
    });
  },
  _computeWrapper(type, options) {
    return loader.visualization.then(v => {
      const wrapper = new v.ControlWrapper({
        'controlType': controlTypes[this.type] || this.type,
        'container': this.$.control,
      });
      v.events.addListener(wrapper, 'ready', () => {
        if (this._maybeNeedStyles) {
          loader.moveStyles(this.shadowRoot);
          this._maybeNeedStyles = false;
        }
      });
      return wrapper;
    });
  },
});

})();
