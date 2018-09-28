if (!this.<%= namespace %>) (function(doc, ev) {
  // define global object
  <%= namespace %> = (function(){
    <%= contents %>
  })();

  // dispatch load event
  ev = doc.createEvent('HTMLEvents');
  if (ev.initEvent) ev.initEvent('depp-load', false, false);
  else ev = new Event('depp-load');
  doc.dispatchEvent(ev);
})(document);
