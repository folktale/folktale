//----------------------------------------------------------------------
//
// This source file is part of the Folktale project.
//
// Copyright (C) 2015-2016 Quildreen Motta.
// Licensed under the MIT licence.
//
// See LICENCE for licence information.
// See CONTRIBUTORS for the list of contributors to the project.
//
//----------------------------------------------------------------------

/*~
 * ---
 * name: module folktale/dta/maybe
 * category: Modelling failures
 */
module.exports = {
  ...require('./maybe'),
  fromEither: require('folktale/data/conversions/either-to-maybe'),
  fromValidation: require('folktale/data/conversions/validation-to-maybe')
};
