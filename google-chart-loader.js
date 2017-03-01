(() => {

window.google = window.google || {};
window.google.visualization = window.google.visualization || {};

const language = window.google.visualization.language || document.documentElement.lang || 'en';
const packages = window.google.visualization.packages || ['corechart'];
const version = window.google.visualization.version || 'current';

const packagesLoaded = {};

let mostRecentLoad = null;

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

const styleSheetSelector = 'head > link[id^="load-css-"][href^="https://www.gstatic.com/charts/"]';
const styleElementId = 'shadow-css';

window.GoogleChartLoader = Polymer({
  is: 'google-chart-loader',
  hostAttributes: {
    hidden: true
  },
  factoryImpl: function(opt_extraPackages) {
    const extraPackages = opt_extraPackages || [];
    const goog = load(packages.concat(extraPackages));
    this._setVisualization(goog.then(g => g.visualization));
    this._setCharts(goog.then(g => g.charts));
  },
  properties: {
    visualization: {
      type: Object,
      notify: true,
      readOnly: true,
    },
    charts: {
      type: Object,
      notify: true,
      readOnly: true,
    },
  },
  moveStyles(target) {
    if (!target) {
      return;
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
    this.visualization.then(() => {
      const styleSheets = Polymer.dom(document).querySelectorAll(styleSheetSelector);
      const imports = styleSheets.map(css => {
         return css.getAttribute('href');
      }).join("';\n @import '");

      styleElement.innerHTML = `@import '${imports}';`;
      target.appendChild(styleElement);
    })
  }
});

})();
