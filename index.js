/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
exports.Core = require('./lib/core').Core;

exports.plugins = {
  validate: require('./plugins/validate')
};

exports.errors = require('./lib/errors');