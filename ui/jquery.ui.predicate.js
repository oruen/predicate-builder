(function(){
  $.widget("ui.predicate", $.extend($.Widget, {
    version: "0.0.1",
    contentElement: null,
    options: {
      valueString: "Value"
    },
    parserRules: [
      'start',
      '  = expr',
      'expr',
      '  = func / value',
      'value',
      '  = value:[0-9]+ { return value.join(""); }',
      'func',
      '  = "(" name:[^,]+ "," args:argument+ ")" { return {operator: name.join(""), value: args }; }',
      'argument',
      '  = val:expr ","? { return val; }'
    ].join("\n"),
    _create: function() {
      this.element.addClass("ui-helper-hidden");
      this._drawScene();
      this.contentElement = this.element.next();
      this._buildParser();
      this._drawContent();
    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
      this.element.removeClass("ui-helper-hidden");
    },
    dump: function() {
      this.element.val(this._valueOf(this.contentElement.find(".ui-predicate-element").first()));
      this.element.trigger("change");
      if (this.drawingContent) { return; }
      var value = this._valueOf(this.contentElement.find(".ui-predicate-element").first());
      if (this.element.val() !== value) {
        this.element.val(value);
        this.element.trigger("change");
      }
    },
    _buildParser: function() {
      this.parser = PEG.buildParser(this.parserRules, {trackLineAndColumn: true});
    },
    _valueOf: function(node) {
      var mode = node.find("select:first").val();
      if (mode === "value") {
        return $(node.find("select")[1]).val();
      } else {
        var args = [],
            predicate = this,
            value = null;
        node.find(".ui-predicate-element-content").first().find("> .ui-predicate-element").each(function(i, child) {
          value = predicate._valueOf($(child));
          if (value) {
            args.push(value);
          }
        });
        if (args.length === 0) {
          return null;
        }
        args.unshift(mode);
        return '(' + args.join(",") + ')';
      }
    },
    _drawScene: function() {
      var scene = $(['<div class="ui-widget ui-corner-all ui-predicate">',
                       '<div class="ui-widget-header ui-corner-all">',
                         this.options.title,
                         '<span class="ui-icon ui-icon-plusthick ui-predicate-add"></span>',
                       '</div>',
                     '</div>'].join("")).css({width: "400px"}),
          predicate = this;
      this.element.after(scene);
      this.addButton = scene.find(".ui-predicate-add");
      this.addButton.on("click", function() {
        predicate._createContentItem();
        predicate.dump();
      });
    },
    _drawContent: function() {
      this.drawingContent = true;
      if (this.element.val().trim().length !== 0) {
        this._drawNode(this.parser.parse(this.element.val()));
      }
      this.drawingContent = false;
      this.dump();
    },
    _drawNode: function(node, contentElement) {
      contentElement = contentElement || this.contentElement;
      var i, element;
      if (typeof(node) !== 'object') {
        this._createContentItem(contentElement, null, node);
      } else {
        element = this._createContentItem(contentElement, node.operator, null).find(".ui-predicate-element-content");
        for (i = 0; i < node.value.length; i++) {
          this._drawNode(node.value[i], element);
        }
      }
    },
    _createContentItem: function(contentElement, operator, value) {
      var contentElement = contentElement || this.contentElement,
          item = $([
            '<div class="ui-predicate-element">',
              '<div class="ui-widget-content ui-corner-all">',
                this._operatorSelect(),
                '<span class="ui-predicate-value">',
                  this._valueSelect(),
                '</span>',
                '<span class="ui-icon ui-icon-plusthick ui-predicate-add ui-helper-hidden"></span>',
                '<span class="ui-icon ui-icon-minusthick ui-predicate-remove"></span>',
              '</div>',
              '<div class="ui-predicate-element-content ui-helper-hidden">',
              '</div>',
            '</div>'
          ].join("")),
          predicate = this;


      // operator select
      item.find("select:first").on("change", function() {
        var valueSelect = $(this).parent().find(".ui-predicate-value"),
            addButton = $(this).parent().find(".ui-predicate-add"),
            removeButton = $(this).parent().find(".ui-predicate-remove"),
            content = $(this).closest(".ui-predicate-element").find(".ui-predicate-element-content");
        if ($(this).val() == "value") {
          valueSelect.removeClass("ui-helper-hidden");
          predicate._trigger("valueShown", null, valueSelect.find("select"));
          addButton.addClass("ui-helper-hidden");
          content.addClass("ui-helper-hidden");
        } else {
          valueSelect.addClass("ui-helper-hidden");
          predicate._trigger("valueHidden", null, valueSelect.find("select"));
          addButton.removeClass("ui-helper-hidden");
          content.removeClass("ui-helper-hidden");
        }
        predicate.dump();
      });
      item.find("select:last").on("change", function() {
        predicate.dump();
      });
      item.find(".ui-predicate-add").on("click", function() {
        predicate._createContentItem(item.find(".ui-predicate-element-content").first());
        predicate.dump();
      });
      item.find(".ui-predicate-remove").on("click", function() {
        item.remove();
        predicate.dump();
        predicate._checkAddButton();
      });

      if (operator) {
        item.find("select:first").val(operator);
        item.find("select:first").trigger("change");
      }
      if (value) {
        item.find("select:last").val(value);
        item.find("select:last").trigger("change");
      }

      contentElement.append(item);
      this._trigger("valueShown", null, item.find(".ui-predicate-value select"));
      this._checkAddButton();
      return item;
    },
    _checkAddButton: function() {
      if (this.contentElement.children(".ui-predicate-element").size() > 0) {
        this.addButton.addClass("ui-helper-hidden");
      } else {
        this.addButton.removeClass("ui-helper-hidden");
      }
    },
    _cachedSelectOptionsFor: function(key, options, selected) {
      this._optionsCache = this._optionsCache || {};
      if (this._optionsCache[key]) {
        return this._optionsCache[key];
      }
      var options = options.map(function(i) { return '<option value="' + i.value + '" ' + (selected === i.value ? 'selected' : '') + '>' + i.title + '</option>' });
      this._optionsCache[key] = '<select>' + options + '</select>';
      return this._optionsCache[key];
    },
    _operatorSelect: function() {
      return this._cachedSelectOptionsFor("operator", this.options.operators.concat({title: this.options.valueString, value: "value"}), "value");
    },
    _valueSelect: function() {
      return this._cachedSelectOptionsFor("value", this.options.values);
    }
  }));
})(jQuery);

