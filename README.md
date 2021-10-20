# google-chart

[Google Charts API](https://developers.google.com/chart/) web components.

See: [Documentation](https://www.webcomponents.org/element/@google-web-components/google-chart)

[![Published on NPM](https://img.shields.io/npm/v/@google-web-components/google-chart.svg)](https://www.npmjs.com/package/@google-web-components/google-chart) [![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@google-web-components/google-chart)

## Usage

### Installation

```sh
npm i @google-web-components/google-chart
```

### In HTML file

```html
<html>
  <head>
    <script type="module">
      import '@google-web-components/google-chart';
    </script>
  </head>
  <body>
    <google-chart data='[["Month", "Days"], ["Jan", 31]]'></google-chart>
  </body>
</html>
```

### In a LitElement

```typescript
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import '@google-web-components/google-chart';

@customElement('new-element')
export class NewElement extends LitElement {
  render() {
    return html`
      <google-chart data='[["Month", "Days"], ["Jan", 31]]'></google-chart>
    `;
  }
}
```

### In a Polymer 3 element

```javascript
import {PolymerElement, html} from '@polymer/polymer';
import '@google-web-components/google-chart';

class NewElement extends PolymerElement {
  static get template() {
    return html`
      <google-chart data='[["Month", "Days"], ["Jan", 31]]'></google-chart>
    `;
  }
}
customElements.define('new-element', NewElement);
```

### More usage examples

See examples in the demo or try this live [JS bin](https://jsbin.com/zitotejimi/edit?html,output).

## Uprading from 3.x

The component has been migrated to LitElement and uses TypeScript now. This migration introduced two breaking changes.

### Removed Polymer-specific `selection-changed` event

The Polymer-specific `selection-changed` event commonly used for 2-way bindings has been removed.
There were previously two events for observing chart selection changes: `google-chart-select` and the Polymer-generated `selection-changed`.
For consistency with other events (e.g. `google-chart-ready`), we keep only `google-chart-select`.

Polymer components using this feature must be updated to explicitly name the selection event ([details](https://polymer-library.polymer-project.org/3.0/docs/devguide/data-binding#two-way-native)).
In the example below, note the addition of `::google-chart-select`.

```diff
- <google-chart selection="{{chartSelection}}"></google-chart>
+ <google-chart selection="{{chartSelection::google-chart-select}}"></google-chart>
```

LitElement components using the `selection-changed` event must be updated in a similar fashion:

```diff
- <google-chart .selection="${chartSelection}" @selection-changed="${reactToChartSelection}"></google-chart>
+ <google-chart .selection="${chartSelection}" @google-chart-select="${reactToChartSelection}"></google-chart>
```

### Removed `google-chart-loader` component

Its functionality can be imported from the `loader.js` module:

```javascript
import {dataTable, load} from '@google-web-components/google-chart/loader.js';
```

or you may instead choose to use `google.visualization.ChartWrapper` directly ([example](https://developers.google.com/chart/interactive/docs/reference#chartwrapper-class)).

## Contributing

Instructions for running the tests and demo locally:

### Installation

```sh
git clone https://github.com/GoogleWebComponents/google-chart.git
cd google-chart
npm install
```

### Running the demo locally

```sh
npm start
```

The browser will open automatically.

### Running the tests

```sh
npm test
```
