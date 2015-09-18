ko.bindingHandlers.quill = {

  init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    var params = valueAccessor();

    // Check whether the value observable is either placed directly or in the paramaters object.
    if (!(ko.isObservable(params) || params["html"] || params["text"])) {
      throw ("You need to define an observable value for the 'quill' binding. " +
             "Either pass the observable directly or as the 'html' or 'text' " +
             "field in the parameters.");
    }

    // Initialize the quill editor, and store it in the data section of the
    // element using jQuery.
    var quill = new Quill(element, { theme: "snow" });
    $.data(element, "quill", quill);

    // Extract the knockout observables and set the initial value.
    var htmlObservable = null;
    var textObservable = null;
    var toolbarSelector = null;
    if (ko.isObservable(params)) {
      htmlObservable = params;
      quill.setHTML(ko.unwrap(htmlObservable));
    }
    else {
      htmlObservable = params["html"];
      textObservable = params["text"];
      toolbarSelector = params["toolbar"];

      if (htmlObservable) {
        quill.setHTML(ko.unwrap(htmlObservable) || "");
      } else if (textObservable) {
        quill.setText(ko.unwrap(textObservable) || "");
      }
      if (toolbarSelector) {
        quill.addModule("toolbar", { container: toolbarSelector });
      }
    }

    // Make sure we update the observables when the editor contents change.
    quill.on("text-change", function(delta, source) {
      if (htmlObservable && ko.isObservable(htmlObservable)) {
        htmlObservable(quill.getHTML());
      }
      if (textObservable && ko.isObservable(textObservable)) {
        textObservable(quill.getText());
      }
    });
  },

  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    // Extract the knockout observables.
    var params = valueAccessor();
    var htmlObservable = null;
    var textObservable = null;
    var enableObservable = null;
    if (ko.isObservable(params)) {
      htmlObservable = params;
    } else {
      htmlObservable = params["html"];
      textObservable = params["text"];
      enableObservable = params["enable"];
    }

    // Update the relevant values in the Quill editor.
    var quill = $.data(element, "quill");
    var selection = quill.getSelection();
    if (htmlObservable) {
      quill.setHTML(ko.unwrap(htmlObservable) || "");
    } else if (textObservable) {
      quill.setText(ko.unwrap(textObservable) || "");
    }
    if (enableObservable) {
      quill.editor.enable(ko.unwrap(enableObservable));
    }
    quill.setSelection(selection);
  }

};
