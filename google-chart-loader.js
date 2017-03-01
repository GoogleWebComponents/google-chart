(() => {

window.google = window.google || {};
window.google.visualization = window.google.visualization || {};

/*
 * Allows configuring the defaults.
 * We check for:
 *   - `language` in `google.visualization` then the document element (default: 'en').
 *   - `packages` in `google.visualization` (default: ['corechart']).
 *   - `Version` in `google.visualization` (default: 'current'). This is overridden after load.
 */
const language = window.google.visualization.language || document.documentElement.lang || 'en';
const packages = window.google.visualization.packages || ['corechart'];
const version = window.google.visualization.Version || 'current';

const packagesLoaded = {};

let mostRecentLoad = null;

/**
 * Wraps the `google.charts.load` function to return a promise.
 * This promise is resolved when the requested packages are loaded.
 * @param {!Array<string>} packages the packages to load
 * @return {!Promise<google>} resolves with the `google` object
 */
const load = packages => {
  const packagesToLoad = packages.reduce((packagesToLoad, pkg) => {
    if (!packagesLoaded[pkg]) {
      packagesLoaded[pkg] = true
      packagesToLoad.push(pkg);
    }
    return packagesToLoad;
  }, []);
  if (0 == packagesToLoad.length) {
    // No new packages to load, just return the newest result.
    return mostRecentLoad;
  }
  return mostRecentLoad = new Promise(resolve => {
    google.charts.load(version, {'packages': packagesToLoad, 'language': language, 'callback': function() {
      console.log(`Google Charts v${google.visualization.Version} loaded with packages: ${packagesToLoad}`);
      resolve(google);
    }});
  });
};

/** @const {string} the selector for Google Visualization stylesheets. */
const styleSheetSelector = 'head > link[id^="load-css-"][href^="https://www.gstatic.com/charts/"]';
/** @const {string} the ID prefix to use when import stylesheets into the shadow DOM. */
const styleElementId = 'shadow-css';

/**
 * Allows creation of a loader when extra packages are required.
 * e.g. new GoogleChartLoader(['table']).visualization
 * This new loader's `visualization` property will not be resolved until both
 * packages (`corechart` and `table`) have been loaded.
 * @param {!Array<string>=} opt_packages the extra packages to load
 */
const GoogleChartLoader = function(opt_packages) {
  const goog = load(packages.concat(opt_packages || []));
  /**
   * Promise for the `google.visualization` object.
   * @type {!Promise<google.visualization>}
   */
  this.visualization = goog.then(g => g.visualization);
  /**
   * Promise for the `google.charts` object.
   * @type {!Promise<google.charts>}
   */
  this.charts = goog.then(g => g.charts);
  Object.freeze(this);
};

/**
 * Move styles from the `Document`'s  head to the shadow DOM root.
 * If the target's root node is the document, this is a no-op.
 * @param {!Polymer.Element} target the location to which we'll import the style sheets
 * @return {!Promise} resolves when the style sheets have been moved
 */
GoogleChartLoader.prototype.moveStyles = function(target) {
  target = target.root.getRootNode();
  if (target == document) {
    return Promise.resolve();
  }
  if (target.sheetCount > 0) {
    const styleElement = target.querySelector(`#${styleElementId}-${target.sheetCount}`);
    styleElement.parentNode.removeChild(styleElement);
  } else {
    target.sheetCount = 0;
  }
  styleElement = document.createElement('style');
  styleElement.setAttribute('id', `${styleElementId}-${++target.sheetCount}`);
  // We wait for this loader's visualization to be loaded
  // because it is resolved after the CSS is available.
  return this.visualization.then(() => {
    const styleSheets = Polymer.dom(document).querySelectorAll(styleSheetSelector);
    const imports = Array.prototype.map.call(styleSheets, css => {
      return css.getAttribute('href');
    }).join("';\n @import '");

    styleElement.innerHTML = `@import '${imports}';`;
    target.appendChild(styleElement);
  });
};

window.GoogleChartLoader = GoogleChartLoader;

})();
