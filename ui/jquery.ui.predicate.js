(function(){
  $.widget("ui.predicate", $.extend($.Widget, {
    version: "0.0.1",
    contentElement: null,
    parserRules: [
      'start',
      '  = expr',
      'expr',
      '  = func / value',
      'value',
      '  = value:[0-9]+ { return value[0]; }',
      'func',
      '  = "(" name:[a-zA-Z0-9]+ "," args:argument+ ")" { return {operator: name[0], value: args }; }',
      'argument',
      '  = val:expr ","? { return val; }'
    ].join("\n"),
    _create: function() {
      this.element.addClass("ui-helper-hidden");
      this._drawScene();
      this.contentElement = this.element.next();
      this._drawContent();
      this._buildParser();
    },
    destroy: function() {
      $.Widget.prototype.destroy.call(this);
      this.element.removeClass("ui-helper-hidden");
    },
    dump: function() {
      this.element.val(this._valueOf(this.contentElement.find(".ui-predicate-element").first()));
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
      this.element.after($(['<div class="ui-widget ui-corner-all ui-predicate">',
                            '<div class="ui-widget-header ui-corner-all">Predicate Editor</div>',
                            '</div>',
                          '</div>'].join("")).css({width: "400px"}));
    },
    _drawContent: function() {
      this._createContentItem();
      this.contentElement.find(".ui-predicate-remove").first().remove();
    },
    _createContentItem: function(contentElement) {
      var contentElement = contentElement || this.contentElement,
          item = $([
            '<div class="ui-predicate-element">',
              '<div class="ui-widget-content ui-corner-all">',
                this._operatorSelect(),
                this._valueSelect(),
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
        var valueSelect = $(this).next(),
            addButton = $(this).parent().find(".ui-predicate-add"),
            removeButton = $(this).parent().find(". ui-predicate-remove"),
            content = $(this).closest(".ui-predicate-element").find(".ui-predicate-element-content");
        if ($(this).val() == "value") {
          valueSelect.removeClass("ui-helper-hidden");
          addButton.addClass("ui-helper-hidden");
          content.addClass("ui-helper-hidden");
        } else {
          valueSelect.addClass("ui-helper-hidden");
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
      });
      item.find(".ui-predicate-remove").on("click", function() {
        item.remove();
        predicate.dump();
      });

      contentElement.append(item);
      this.dump();
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
      return this._cachedSelectOptionsFor("operator", this.options.operators.concat({title: "Value", value: "value"}), "value");
    },
    _valueSelect: function() {
      return this._cachedSelectOptionsFor("value", this.options.values);
    }
  }));
})(jQuery);
