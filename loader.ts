/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * https://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * https://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * https://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * https://polymer.github.io/PATENTS.txt
 */

/**
 * Promise that resolves when the gviz loader script is loaded, which
 * provides access to the Google Charts loading API.
 */
const loaderPromise = new Promise((resolve, reject) => {
  // Resolve immediately if the loader script has been added already and
  // `google.charts.load` is available. Adding the loader script twice throws
  // an error.
  if (typeof google !== 'undefined' && google.charts &&
      typeof google.charts.load === 'function') {
    resolve();
  } else {
    // Try to find existing loader script.
    let loaderScript: HTMLScriptElement|null = document.querySelector(
        'script[src="https://www.gstatic.com/charts/loader.js"]');
    if (!loaderScript) {
      // If the loader is not present, add it.
      loaderScript = document.createElement('script');
      // Specify URL directly to pass JS compiler conformance checks.
      loaderScript.src = 'https://www.gstatic.com/charts/loader.js';
      document.head.appendChild(loaderScript);
    }
    loaderScript.addEventListener('load', resolve);
    loaderScript.addEventListener('error', reject);
  }
});

interface LoadSettings {
  version?: string;
  packages?: string[];
  language?: string;
  mapsApiKey?: string;
}

/**
 * Loads Google Charts API with the selected settings or using defaults.
 *
 * The following settings are available:
 * - version: which version of library to load, default: 'current',
 * - packages: which chart packages to load, default: ['corechart'],
 * - language: what language to load library in, default: `lang` attribute on
 *   `<html>` or 'en' if not specified,
 * - mapsApiKey: key to use for maps API.
 */
export async function load(settings: LoadSettings = {}): Promise<void> {
  await loaderPromise;
  const {
    version = 'current',
    packages = ['corechart'],
    language = document.documentElement.lang || 'en',
    mapsApiKey,
  } = settings;
  return google.charts.load(version, {
    'packages': packages,
    'language': language,
    'mapsApiKey': mapsApiKey,
  });
}

/** Types that can be converted to `DataTable`. */
export type DataTableLike = unknown[][]|{cols: unknown[], rows?: unknown[][]}|
                            google.visualization.DataTable;

/**
 * Creates a DataTable object for use with a chart.
 *
 * Multiple different argument types are supported. This is because the
 * result of loading the JSON data URL is fed into this function for
 * DataTable construction and its format is unknown.
 *
 * The data argument can be one of a few options:
 *
 * - null/undefined: An empty DataTable is created. Columns must be added
 * - !DataTable: The object is simply returned
 * - {{cols: !Array, rows: !Array}}: A DataTable in object format
 * - {{cols: !Array}}: A DataTable in object format without rows
 * - !Array<!Array>: A DataTable in 2D array format
 *
 * Un-supported types:
 *
 * - Empty !Array<!Array>: (e.g. `[]`) While technically a valid data
 *   format, this is rejected as charts will not render empty DataTables.
 *   DataTables must at least have columns specified. An empty array is most
 *   likely due to a bug or bad data. If one wants an empty DataTable, pass
 *   no arguments.
 * - Anything else
 *
 * See <a
 * href="https://developers.google.com/chart/interactive/docs/reference#datatable-class">the
 * docs</a> for more details.
 *
 * @param data The data which we should use to construct new DataTable object
 */
export async function dataTable(data: DataTableLike|undefined):
    Promise<google.visualization.DataTable> {
  // Ensure that `google.visualization` namespace is added to the document.
  await load();
  if (data == null) {
    return new google.visualization.DataTable();
  } else if ((data as google.visualization.DataTable).getNumberOfRows!) {
    // Data is already a DataTable
    return data as google.visualization.DataTable;
  } else if ((data as {
               cols: unknown[]
             }).cols) {  // data.rows may also be specified
    // Data is in the form of object DataTable structure
    return new google.visualization.DataTable(data);
  } else if ((data as unknown[][]).length > 0) {
    // Data is in the form of a two dimensional array.
    return google.visualization.arrayToDataTable(data as unknown[][]);
  } else if ((data as unknown[][]).length === 0) {
    // Chart data was empty.
    // We throw instead of creating an empty DataTable because most
    // (if not all) charts will render a sticky error in this situation.
    throw new Error('Data was empty.');
  }
  throw new Error('Data format was not recognized.');
}

/**
 * Creates new `ChartWrapper`.
 * @param container Element in which the chart will be drawn
 */
export async function createChartWrapper(container: HTMLElement):
    Promise<google.visualization.ChartWrapper> {
  // Ensure that `google.visualization` namespace is added to the document.
  await load();
  // Typings suggest that `chartType` is required in `ChartSpecs`, but it works
  // without it.
  return new google.visualization.ChartWrapper(
      {'container': container} as unknown as google.visualization.ChartSpecs);
}
