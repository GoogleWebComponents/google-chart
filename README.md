# google-chart

[Google Charts API](https://developers.google.com/chart/) web components.

See: [Documentation](https://www.webcomponents.org/element/@google-web-components/google-chart)

[![Build Status](https://travis-ci.org/GoogleWebComponents/google-chart.svg?branch=master)](https://travis-ci.org/GoogleWebComponents/google-chart) [![Published on NPM](https://img.shields.io/npm/v/@google-web-components/google-chart.svg)](https://www.npmjs.com/package/@google-web-components/google-chart) [![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@google-web-components/google-chart)

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
import {LitElement, html, customElement} from 'lit-element';
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

## Contributing

Instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/GoogleWebComponents/google-chart.git
cd google-chart
npm install
npm install -g polymer-cli
```

### Running the demo locally
```sh
polymer serve --open
```
and visit `http://127.0.0.1:8081/components/@google-web-components/google-chart/demo/`.

### Running the tests
```sh
polymer test --npm
```
