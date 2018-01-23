(() => {

const loader = new GoogleChartLoader(['charteditor']);

Polymer({
  is: 'google-chart-editor',
  properties: {
    editor: {
      type: Object,
      value: () => loader.visualization.then(v => new v.ChartEditor()),
      observer: '_editorChanged',
    },
    opened: {
      type: Boolean,
      notify: true,
      observer: '_openedChanged',
      value: false,
    },
    type: {
      type: String,
      notify: true,
    },
    options: {
      type: Object,
      notify: true,
    },
    src: {
      type: String,
      notify: true,
    },
  },
  listeners: {
    'google-chart-ready': '_onChartReady',
  },
  attached() {
    const $ = q => Polymer.dom(this).querySelector(q);
    this.chart = $('google-chart');
    const controlSlot = this.shadowRoot.querySelector('slot[name=control]');
    this.dataSourceInput = controlSlot.assignedNodes()[0] || 'urlbox';
  },
  _editorChanged(editor) {
    Promise.all([loader.visualization, editor]).then(ve => {
      const [v, e] = ve;
      v.events.addListener(e, 'ok', () => {
        const wrapper = e.getChartWrapper();
        this.chart.type = this.type = wrapper.getChartType();
        this.chart.options = this.options = wrapper.getOptions();
        this.chart.src = this.src = wrapper.getDataSourceUrl();
        this._dontReact = true;
        this.opened = false;
        this.fire('google-chart-ok');
      });
      v.events.addListener(e, 'cancel', () => {
        this._dontReact = true;
        this.opened = false;
        this.fire('google-chart-cancel');
      });
    });
  },
  _openedChanged(opened) {
    if (this._dontReact) {
      this._dontReact = false;
      return;
    }
    if (opened) {
      Promise.all([this.editor, this.chart.wrapper]).then(ew => {
        const [editor, wrapper] = ew;
        editor.openDialog(wrapper, {'dataSourceInput': this.dataSourceInput});
      });
    } else {
      this.editor.then(e => e.closeDialog());
    }
  },
  /**
   * Updates the chart in the open dialog.
   * If we make changes to the chart outside of the editor, we should update
   * the chart inside the editor, as well.
   * We only update the chart if it's the one used for the editor.
   * @param {!Event} evt
   */
  _onChartReady(evt) {
    if (!this.opened || this.chart != evt.target) {
      return;
    }
    Promise.all([this.editor, this.chart.wrapper]).then(ew => {
      const [editor, wrapper] = ew;
      editor.setChartWrapper(wrapper);
    });
  },
});

})();
