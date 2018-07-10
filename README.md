google-chart
============

[Google Charts API](https://developers.google.com/chart/) web components.

See https://elements.polymer-project.org/elements/google-chart

[![Build Status](https://travis-ci.org/GoogleWebComponents/google-chart.svg?branch=master)](https://travis-ci.org/GoogleWebComponents/google-chart)

## Google Chart Polymer 3
Google chart web component that is compatiable with Polymer 3 and
has an initialization script to ensure the web component has finished
loading before drawing onto the chart.

import {initGCharts} from "../google-chart.js"
initGCharts(()=>{})