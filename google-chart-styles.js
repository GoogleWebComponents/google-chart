const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `<dom-module id="google-chart-styles">
  <template>
    <style>
      :host {
        display: -webkit-flex;
        display: -ms-flex;
        display: flex;
        margin: 0;
        padding: 0;
        width: 400px;
        height: 300px;
      }

      :host([type="gauge"]) {
        width: 300px;
        height: 300px;
      }

      #chartdiv {
        width: 100%;
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
