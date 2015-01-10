(function(global) {
  'use strict';

  var colSeps = [',', ';', "\t"];
  var defaults = {
    colSep: 'auto',
    rowSep: 'auto',
    quoteChar: '"',
    forceQuotes: false
  }, options = {};

  var loadOptions = function loadOptions(input) {
    var key;

    for (key in defaults) {
      if (defaults.hasOwnProperty(key)) {
        options[key] = input && input[key] !== undefined ? input[key] : defaults[key];
      }
    }
  };

  var detectRowSep = function detectRowSep(input) {
    var match = input.match(/(\r\n|\r|\n)/);

    return match ? match[0] : "\r\n";
  };

  var detectColSep = function detectColSep(input) {
    var count = 0, match = colSeps[0], i, currMatch, currCount;

    for (i = 0; i < colSeps.length; ++i) {
      currMatch = input.match(new RegExp(colSeps[i], 'g'));
      currCount = currMatch ? currMatch.length : 0;

      if (currCount > count) {
        match = colSeps[i];
        count = currCount;
      }
    }

    return match;
  };

  var parseRow = function parseRow(row, options) {
    var finalRow = [], cell = [], inQuote = false, escape = false, i, ch;

    for (i = 0; i <= row.length; ++i) {
      ch = row[i];

      if (ch === options.quoteChar && !escape) {
        if (! inQuote) {
          inQuote = true;
        } else if (i + 1 < row.length) {
          if (row[i + 1] !== options.quoteChar) {
            inQuote = false;
          } else {
            escape = true;
          }
        }
      } else {
        escape = false;

        if ((ch === options.colSep && !inQuote) || i === row.length) {
          finalRow.push(cell.join(''));

          cell = [];
        } else {
          cell.push(ch);
        }
      }
    }

    return finalRow;
  };

  var parse = function parse(input, opts) {
    loadOptions(opts);

    options.rowSep = options.rowSep == 'auto' ? detectRowSep(input) : options.rowSep;
    options.colSep = options.colSep == 'auto' ? detectColSep(input) : options.colSep;

    input = input.replace(/\s+$/, '');

    return input.split(options.rowSep).map(function (row) {
      if (row.indexOf(options.quoteChar) > -1) {
        return parseRow(row, options);
      } else {
        return row.split(options.colSep);
      }
    });
  };

  var buildArray = function buildArray(callback) {
    var array = [];

    callback.call(null, array);

    return array;
  };

  var generate = function generate(input, opts) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      opts  = arguments[0];
      input = buildArray(arguments[arguments.length - 1]);
    }

    loadOptions(opts);
    options.rowSep = (options.rowSep === 'auto') ? "\n" : options.rowSep;

    return input.map(function(row) {
      if (Object.prototype.toString.call(row) !== '[object Array]') {
        throw new Error('Expected cell array for CSV row, but got "' + row + '"');
      }

      return row.map(function(cell) {
        var withQuotes = options.forceQuotes === true;

        if (!withQuotes && (
            cell.indexOf(options.colSep) > -1 ||
            cell.indexOf(options.rowSep) > -1 ||
            cell.indexOf(options.quoteChar) > -1)) {
          withQuotes = true;
        }

        if (withQuotes) {
          cell = options.quoteChar +
            cell.replace(
              new RegExp('(' + options.quoteChar + ')', 'g'), '$1$1') +
            options.quoteChar;
        }

        return cell;
      }).join(options.colSep);
    }).join(options.rowSep);
  };

  var iface = {
    parse:    parse,
    generate: generate,
    options:  options
  };

  if (typeof exports !== "undefined") {
    module.exports = iface;
  } else if (typeof define === "function") {
    define(function () {
      return iface;
    });
  } else {
    global.CSV = iface;
  }
})(this);
