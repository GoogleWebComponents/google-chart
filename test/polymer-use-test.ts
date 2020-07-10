/**
 * @license
 * Copyright 2014-2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../google-chart.js';
import {customElement, property} from '@polymer/decorators';
import {PolymerElement, html} from '@polymer/polymer';
import {GoogleChart} from '../google-chart.js';
import {DataTableLike} from '../loader.js';
import {ready} from './helpers.js';

const assert = chai.assert;

suite('<google-chart> use in Polymer element', () => {
  let element: GoogleChartTestElement;

  setup(async () => {
    element = new GoogleChartTestElement();
    document.body.append(element);
    await ready(element);
  });

  teardown(() => {
    element?.remove();
  })

  test('passes properties', () => {
    const chartDiv =
        element.$['chart'].shadowRoot!.getElementById('chartdiv')!;
    assert.include(chartDiv.innerText, 'Value');
    assert.include(chartDiv.innerText, 'Something');
  });

  test('deep options change via binding', async () => {
    element.set('options.title', 'New title');
    const chartDiv =
        element.$['chart'].shadowRoot!.getElementById('chartdiv')!;
    await ready(element);
    assert.include(chartDiv.innerText, 'New title');
  });

  test('two-way binding', async () => {
    // chart-selection-changed fires because the propery has {notify: true}.
    const chartSelectionChanged = new Promise(resolve => {
      element.addEventListener('chart-selection-changed', resolve, {once: true});
    });
    // Get chartWrapper and simulate user selection:
    // https://developers.google.com/chart/interactive/docs/dev/events#firing-an-event
    const chartWrapper: google.visualization.ChartWrapper=
        (element.$['chart'] as GoogleChart)['chartWrapper']!;
    chartWrapper.getChart().setSelection([{row: 1}]);
    google.visualization.events.trigger(chartWrapper.getChart(), 'select', {});
    await chartSelectionChanged;

    assert.sameDeepMembers(element.chartSelection!, [{row: 1, column: null}]);
  });
});

@customElement('google-chart-polymer-test')
class GoogleChartTestElement extends PolymerElement {
  static get template() {
    return html`
      <google-chart
          id="chart"
          options="[[options]]"
          data="[[data]]"
          selection="{{chartSelection::google-chart-select}}">
      </google-chart>
    `;
  }

  @property({type: Object})
  options: google.visualization.ColumnChartOptions = {};

  @property({type: Object})
  data: DataTableLike = [
    ['Data', 'Value'],
    ['Something', 1],
    ['Thing', 2],
    ['Entry', 3],
  ];

  @property({type: Array, notify: true})
  chartSelection: unknown[]|undefined;
}
