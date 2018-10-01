google-chart
============

[Google Charts API](https://developers.google.com/chart/) web components.

See https://elements.polymer-project.org/elements/google-chart

[![Build Status](https://travis-ci.org/GoogleWebComponents/google-chart.svg?branch=master)](https://travis-ci.org/GoogleWebComponents/google-chart)

Fork of Google's Google Charts web components.

## Google Chart Polymer 3
Google chart web component that is compatible with Polymer 3 and
has an initialization script to ensure the web component has finished
loading before drawing onto the chart.

Install with `npm install --save google-chart-polymer-3` or `yarn add google-chart-polymer-3`

## Usage
Usage is similar to the polymer 2 version of google-chart however you now
have a wrapper to ensure that the custom elements are on the page before (there might have been another reason but I forget)
you are able to draw anything onto the canvas. See `http://127.0.0.1:8081/components/google-chart/demo/` after running `polymer serve`

```
<script type="module">
    import {initGCharts} from "../google-chart.js"
    initGCharts(()=>{
      var chart = document.getElementById('timeline');
      document.createElement('google-chart-loader').dataTable([
        ['Name', 'Start', 'End'],
        ['Washington', new Date(1789, 3, 30), new Date(1797, 2, 4)],
        ['Adams', new Date(1797, 2, 4), new Date(1801, 2, 4)],
        ['Jefferson', new Date(1801, 2, 4), new Date(1809, 2, 4)]
      ]).then(function(dataTable) {
        chart.data = dataTable;
      });
    })
</script>
```
