function loadScript(url, callback){
   // Adding the script tag to the head as suggested before
   var head = document.getElementsByTagName('head')[0];
   var script = document.createElement('script');
   script.type = 'text/javascript';
   script.src = url;

   // Then bind the event to the callback function.
   // There are several events for cross browser compatibility.
   script.onload = callback;

   // Fire the loading
   head.appendChild(script);
   return script;
}

export {loadScript}