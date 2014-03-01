/**
 * Created by Andy <andy@sumskoy.com> on 26/02/14.
 */
var fs = require('fs');

// Define line type patterns and their identifiers
var linetypes = {
    dbstart : { pattern: /^\s*\/\*\*/ },
    dbanno  : { pattern: /^\s*\*\s?@([\w:-_]+)\(?([^)]+)?\)?/, returns: { name:1, value:2 } },
    dbend   : { pattern: /^\s*\*\/$/ },
    fnsig1  : { pattern: /^\s?function\s+(\w+)\s?/, returns: { name:1 } },
    fnsig2  : { pattern: /^\s?exports\.(\w+)\s?=\s?function/, returns: { name:1 } },
    fnsig3  : { pattern: /^\s?module\.exports\s?=\s?function/, returns: { name: '$anonymous' } },
    fnsig4  : { pattern: /exports\[['"](\w+)['"]\]\s*=\s*function/, returns: { name:1 } },
    fnsig5  : { pattern: /^\s*var\s+(\w+)\s*=\s*function/, returns: { name:1 } },
    fnsig6  : { pattern: /^\s*(\w+)\s*:\s*function/, returns: { name:1 } },
    fnsig7  : { pattern: /module\s*\(\s*(?:(?:'([^']+)')|(?:"([^"]+)")).*function/, returns: { name: '$module' } }
};

var trim = function(str) {
    return 'string' == typeof str ? str.replace(/^\s+/,'').replace(/\s+$/,'') : str;
};

/**
 * Runs through linetypes, identifying str
 */
var identify = function(str) {

    // Try all predefined line type patterns
    for(var i in linetypes) if (linetypes.hasOwnProperty(i)) {

        // Check for a match
        if(null != (match = str.match( linetypes[i].pattern ))) {

            // Default returns type and regexp match results
            var returns = { id: i, match: match };

            // If specific values are requested, fill those in
            if('undefined' != typeof linetypes[i].returns) {
                for(var r in linetypes[i].returns) if (linetypes[i].returns.hasOwnProperty(r)) {
                    returns[r] = 'string' == typeof linetypes[i].returns[r] ?
                        linetypes[i].returns[r] : trim(match[linetypes[i].returns[r]]);
                }
            }

            return returns;
        }
    }

    return false;
};

var analyze = function (data) {

    // Object for holding annotation data
    var annotations = {};

    // Iterate over lines
    var lines = data.split('\n');
    var current = {};
    for(var num in lines) if(lines.hasOwnProperty(num)) {

        // Get line type
        var type = identify(lines[num]);

        switch(type.id) {
            case 'dbstart':
                // Reset current annotation object
                current = {};
                break;

            case 'dbanno':
                // Store whatever was annotated, bucketing values of duplicate keys
                var annotationValue = undefined == type.value || '' == type.value ? true : type.value;
                if(undefined != current[type.name]) {
                    // Create array to hold items
                    if('string' == typeof current[type.name])
                        current[type.name] = [current[type.name]];
                    current[type.name].push(annotationValue);
                } else {
                    current[type.name] = annotationValue;
                }
                break;

            case 'fnsig1':
            case 'fnsig2':
            case 'fnsig3':
            case 'fnsig4':
            case 'fnsig5':
            case 'fnsig6':
            case 'fnsig7':
                // Store current annotations under function name
                annotations[type.name] = current;
                current = {};
                break;

            default: break;
        }
    }

    return annotations;
};

/**
 * Get an object representation of all annotations in file
 *
 * @param filename{String} filename Path to file
 * @param callback{Function} callback
 *
 */
var get = function (filename, callback) {

    // Read file
    fs.readFile(filename, 'utf8', function(err, data) {
        if(!err) {
            var annotations = analyze(data);
            callback(null, annotations);
        } else {
            callback(err, null);
        }
    });
};

var getSync = function (filename) {

    // Read file
    var data = fs.readFileSync(filename, 'utf8');

    // Analyze if possible
    if('string' == typeof data) {
        return analyze(data);
    } else {
        return false;
    }
};

exports.get     = get;
exports.getSync = getSync;