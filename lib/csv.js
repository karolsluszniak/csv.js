var CSV = (function() {
  'use strict';

  var defaults = {
    colSep: ',',
    rowSep: 'auto',
    quoteChar: '"',
    forceQuotes: false
  };

  var withDefaults = function withDefaults(input) {
    var result = {}, key;

    for (key in defaults) {
      result[key] = defaults[key];
    };

    for (key in input) {
      result[key] = input[key];
    };

    return result;
  };

  var detectRowSep = function detectRowSep(input) {
    var match = input.match(/[\r\n]{1,2}/);

    return match ? match[0] : "\n";
  };

  var parseRow = function parseRow(row, options) {
    var finalRow = [], cell = [], inQuote = false, escape = false, i;

    for (i = 0; i <= row.length; ++i) {
      var ch = row[i];

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

  var parse = function parse(input, options) {
    options = withDefaults(options);

    if (options.rowSep == 'auto') {
      options.rowSep = detectRowSep(input);
    }

    return input.split(options.rowSep).map(function (row) {
      if (row.indexOf(options.quoteChar) > -1) {
        return parseRow(row, options);
      } else {
        return row.split(options.colSep);
      }
    });
  };

  var buildArray = function buildInput(callback) {
    var array = [];

    callback.call(null, array);

    return array;
  };

  var generate = function generate(input, options) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      options = arguments[0];
      input   = buildArray(arguments[arguments.length - 1]);
    }

    options = withDefaults(options);

    if (options.rowSep === 'auto') {
      options.rowSep = "\n";
    }

    return input.map(function(row) {
      if (Object.prototype.toString.call(row) !== '[object Array]') {
        throw new Error('Expected cell array for CSV row, but got "' + row + '"');
      }

      return row.map(function(cell) {
        var withQuotes = options.forceQuotes === true;

        if (!withQuotes && (cell.indexOf(options.colSep) > -1 ||
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

  return {
    parse:    parse,
    generate: generate
  };
})();
