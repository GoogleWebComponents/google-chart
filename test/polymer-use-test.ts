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
});

@customElement('google-chart-polymer-test')
class GoogleChartTestElement extends PolymerElement {
  static get template() {
    return html`
      <google-chart id="chart" options="[[options]]" data="[[data]]">
      </google-chart>
    `;
  }

  @property({type: Object})
  options: google.visualization.ColumnChartOptions = {};

  @property({type: Object})
  data: DataTableLike = [
    ['Data', 'Value'],
    ['Something', 1],
  ];
}
