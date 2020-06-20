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

import {timeOut} from '@polymer/polymer/lib/utils/async.js';
import {Debouncer} from '@polymer/polymer/lib/utils/debounce.js';
import {GoogleChart} from '../google-chart.js';
import {dataTable, load, DataTableLike} from '../loader.js';
import {ready} from './helpers.js';

const assert = chai.assert;

suite('<google-chart>', function() {
  var chart: GoogleChart;
  var waitCheckAndDoneDebouncer: Debouncer|null;
  setup(function() {
    chart = fixture('chart-fixture') as GoogleChart;
    waitCheckAndDoneDebouncer = null;
  });
  var waitCheckAndDone = function(check: () => unknown, done: () => void) {
    setTimeout(function() {
      if (check()) {
        waitCheckAndDoneDebouncer = Debouncer.debounce(
            waitCheckAndDoneDebouncer, timeOut.after(100), done);
      } else {
        waitCheckAndDone(check, done);
      }
    }, 50);
  };
  suite('Default Functionality', function() {
    setup(function() {
      chart.data = [ ['Data', 'Value'], ['Something', 1] ];
    });
    test('fires google-chart-ready event for initial load', function(done) {
      chart.addEventListener('google-chart-ready', function() {
        assert.isTrue(chart.drawn);
        done();
      });
    });
    test('fires google-chart-ready event for redraw call', function(done) {
      var drawCount = 0;
      chart.addEventListener('google-chart-ready', function() {
        assert.isTrue(chart.drawn);
        ++drawCount;
        if (drawCount == 4) { done(); }
        else chart.redraw();
      });

    });
    test('default type is column', function() {
      assert.equal(chart.type, 'column');
    });
    test('can change type', function(done) {
      chart.type = 'line';
      waitCheckAndDone(function() {
        // A circle indicates the chart type change was drawn:
        return chart.shadowRoot!.querySelector('circle');
      }, done);
    });
    test('default selection is null', function() {
      assert.equal(chart.selection, null);
    });
    test('can change selection', function(done) {
      chart.selection = [ {row: 0} ];
      waitCheckAndDone(function() {
        // A white stroked rectangle signals the selection was drawn:
        return chart.shadowRoot!.querySelector('rect[stroke="#ffffff"]');
      }, done);
    });
    test('updates selection', function(done) {
      chart.data = [
        ['Data', 'Value'],
        ['Something 1', 1],
        ['Something 2', 2],
        ['Something 3', 3],
      ];
      chart.addEventListener('google-chart-select', () => {
        assert.sameDeepMembers(chart.selection!, [ {row: 2, column: 1} ]);
        done();
      }, {once: true});
      chart.selection = [ {row: 0, column: 1} ];
      chart.addEventListener('google-chart-ready', () => {
        // Look for something that can be clicked. Find rectangles for legend
        // and each bar.
        const chartDiv = chart.shadowRoot!.getElementById('chartdiv')!;
        const rects = chartDiv.querySelectorAll('rect[fill="#3366cc"]');
        // Click on the last bar ('Something 3').
        rects[3].dispatchEvent(new MouseEvent('click', {bubbles: true}));
      }, {once: true});
    });
    test('default options are null', function() {
      assert.equal(chart.options, null);
    });
    test('can change options', function(done) {
      var expectedTitle = 'New Title';
      var initialDraw = true;
      chart.addEventListener('google-chart-ready', function() {
        if (initialDraw) {
          initialDraw = false;
          chart.options = {'title': expectedTitle};
        } else {
          assert.equal(chart.shadowRoot!.querySelector('text')!.innerHTML, expectedTitle);
          done();
        }
      });
    });
    test('can change deep options', function(done) {
      chart.options = {'title': 'Old Title'};
      var spyRedraw: SinonSpy;
      var expectedTitle = 'New Title';
      var initialDraw = true;
      chart.addEventListener('google-chart-ready', function() {
        if (initialDraw) {
          spyRedraw = sinon.spy(chart['chartWrapper']!, 'draw');
          initialDraw = false;
          const options = chart.options as google.visualization.ColumnChartOptions;
          options.title = 'Debounced Title';
          chart.options = options;
          options.title = expectedTitle;
          chart.options = options;
          assert.isFalse(spyRedraw.called);
        } else {
          assert.equal(chart.shadowRoot!.querySelector('text')!.innerHTML, expectedTitle);
          assert.isTrue(spyRedraw.calledOnce);
          spyRedraw.restore();
          done();
        }
      });
    });
    test('creates png chart uri', function (done) {
      chart.addEventListener('google-chart-ready', function(event) {
        var uri = chart.imageURI!;
        assert.isString(uri);
        assert.match(uri, /^data:image\/png;base64/, 'png regexp matches');
        done();
      });
    });
    test('can render multiple instances', function (done) {
      var secondChart = document.createElement('google-chart');
      secondChart.data = [ ['Data', 'Value'], ['Something', 1] ];

      // Ensure second chart is rendered. Clean up test.
      secondChart.addEventListener('google-chart-ready', function() {
        document.body.removeChild(secondChart);
        done();
      });

      document.body.appendChild(secondChart);
    });
  });

  suite('Class', () => {
    test('can be created', async () => {
      const chart = new GoogleChart();
      chart.data = [ ['Data', 'Value'], ['Something', 1] ];
      document.body.appendChild(chart);
      await ready(chart);
      document.body.removeChild(chart);
    });
  });

  suite('Redrawing', () => {
    let chart: GoogleChart;
    let dt: google.visualization.DataTable;
    setup(async () => {
      chart = fixture('chart-fixture') as GoogleChart;
      dt = await dataTable(undefined);
      dt.addColumn('number', 'x');
      dt.addColumn('number', 'y');
      dt.addRow([1, 1]);
    });

    async function countBars(chart: GoogleChart) {
      await ready(chart);
      return Array.from(chart.shadowRoot!.querySelectorAll('rect[fill="#3366cc"]')).length;
    }

    test('redraws after DataTable change', async () => {
      chart.data = dt;
      const barsBefore = await countBars(chart);

      dt.addRow([2, 2]);
      chart.redraw();
      const barsAfter = await countBars(chart);
      assert.isAbove(barsAfter, barsBefore);
    });
    test('redraws after DataView change', async () => {
      const view = new google.visualization.DataView(dt);
      chart.view = view;
      const barsBefore = await countBars(chart);

      dt.addRow([2, 2]);
      chart.redraw();
      const barsAfter = await countBars(chart);
      assert.isAbove(barsAfter, barsBefore);
    });
  });

  suite('Events', function() {
    setup(function() {
      chart.data = [ ['Data', 'Value'], ['Something', 1] ];
    });

    test('can be added', function(done) {
      chart.events = ['onmouseover'];
      chart.addEventListener('google-chart-ready', function() {
        google.visualization.events.trigger(
            chart['chartWrapper']!.getChart(), 'onmouseover', {'row': 1, 'column': 5});
      });
      chart.addEventListener('google-chart-onmouseover', function(e) {
        const {detail} = (e as CustomEvent);
        assert.equal(detail.data.row, 1);
        assert.equal(detail.data.column, 5);
        done();
      });
    });
  });

  suite('Data Source Types', function() {
    test('[rows] and [cols]', function (done) {
      chart.cols = [
        {'label': 'Data', 'type': 'string'},
        {'label': 'Value', 'type': 'number'}
      ];
      chart.rows = [
        ['Something', 1]
      ];
      chart.addEventListener('google-chart-ready', function() {
        done();
      });
    });

    test('[rows] and [cols] with date string repr is broken', function(done) {
      chart.cols = [ { 'type': 'date' } ];
      chart.rows = [ ['Date(1789, 3, 30)'] ];
      waitCheckAndDone(function() {
        const chartDiv = chart.shadowRoot!.getElementById('chartdiv')!;
        return chartDiv.innerHTML ==
          'Error: Type mismatch. Value Date(1789, 3, 30) ' +
          'does not match type date in column index 0';
      }, done);
    });
    var setDataAndWaitForRender = function(data: DataTableLike|string, done: () => void) {
      chart.data = data;
      chart.addEventListener('google-chart-ready', function() {
        done();
      });
    };
    test('[data] is 2D Array', function(done) {
      setDataAndWaitForRender([ ['Data', 'Value'], ['Something', 1] ], done);
    });
    test('[data] is DataTable Object format', function(done) {
      setDataAndWaitForRender({
        'cols': [
          {'label': 'Data', 'type': 'string'},
          {'label': 'Value', 'type': 'number'}
        ],
        'rows': [
          {'c': ['Someting', 1]} as any
        ]
      }, done);
    });
    test('[data] is DataTable', function(done) {
      chart.addEventListener('google-chart-ready', function() {
        done();
      });
      dataTable([
        ['Data', 'Value'],
        ['Something', 1]
      ]).then(function(dataTable) {
        chart.data = dataTable;
      });
    });
    test('[data] is DataTable from DataSource Query', function(done) {
      chart.addEventListener('google-chart-ready', function() {
        done();
      });
      load().then(() => {
        const q = new google.visualization.Query('query.json');
        q.send((res) => {
          chart.data = res.getDataTable();
        });
      });
    });
    test('[data] is JSON URL for 2D Array', function(done) {
      setDataAndWaitForRender('test-data-array.json', done);
    });
    test('[data] is JSON URL for DataTable Object format', function(done) {
      setDataAndWaitForRender('test-data-object.json', done);
    });
    test('[view] is DataView', function(done) {
      chart.addEventListener('google-chart-ready', function() {
        done();
      });
      dataTable([
        ['Data', 'Value'],
        ['Something', 1]
      ])
      .then((dataTable) => {
        chart.view = new google.visualization.DataView(dataTable);
      });
    });
    test('multiple calls to JSON URL', function(done) {
      setDataAndWaitForRender('test-data-array.json', function() {
        setDataAndWaitForRender('test-data-object.json', done);
      });
    });
  });

  suite('Timeline chart workaround', () => {
    // Handle `setSelection` on timeline chart that emits `select` event.
    test('set selection does not loop', async () => {
      chart.type = 'timeline';
      chart.cols = [
        {type: 'string', label: 'President'},
        {type: 'date', label: 'Start'},
        {type: 'date', label: 'End'},
      ];
      chart.rows = [
        ['Washington', new Date(1789, 3, 30), new Date(1797, 2, 4)],
        ['Adams',      new Date(1797, 2, 4),  new Date(1801, 2, 4)],
        ['Jefferson',  new Date(1801, 2, 4),  new Date(1809, 2, 4)],
      ];
      await ready(chart);
      // Set and update the selection.
      chart.selection = [{row: 0, column: null}];
      chart.selection = [{row: 1, column: null}];
      assert.isDefined(chart.selection);
    });
  });
});
