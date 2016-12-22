//----------------------------------------------------------------------
//
// This source file is part of the Folktale project.
//
// See LICENCE for licence information.
// See CONTRIBUTORS for the list of contributors to the project.
//
//----------------------------------------------------------------------

const curry = require('folktale/core/lambda/curry/');
const sequence = require('./sequence');
module.exports = curry(3, (m, f, list) => sequence(m, list.map(f)));
