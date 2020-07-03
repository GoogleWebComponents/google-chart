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
import {GoogleChart} from '../google-chart.js';
import {load} from '../loader.js';
import {ready} from './helpers.js';

const assert = chai.assert;

// This test has to run separately in a clean document because Google Charts
// API is loaded only once per document.
suite('Custom load', () => {
  suiteSetup(() => {
    // Ensure Google Charts is not loaded.
    assert.isUndefined(window.google?.visualization?.DataTable);
    return load({version: '45.2'});
  });

  test('loads Google Charts API with custom settings', () => {
    // Verify that the library has been loaded with correct settings by
    // inspecting scripts added to the document.
    assert.isNotNull(document.querySelector('script[src*="charts/45.2"]'));
    assert.isNotNull(document.querySelector('script[src*="corechart_module"]'));
    assert.isNotNull(document.querySelector('script[src*="__de"]'));
  });

  test('loads packages for chart type="table"', async () => {
    const chart = fixture('type-table') as GoogleChart;
    chart.data = [ ['Data', 'Value'], ['Something', 1] ];
    await ready(chart);
    const chartDiv = chart.shadowRoot!.getElementById('chartdiv')!;
    assert.isAbove(chartDiv.childElementCount, 0);
  });
});
