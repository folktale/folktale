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
 * name: module folktale/data/conversions
 * category: Converting data
 * stability: experimental
 */
module.exports = {
  eitherToValidation: require('./either-to-validation'),
  eitherToMaybe: require('./either-to-maybe'),
  validationToEither: require('./validation-to-either'),
  validationToMaybe: require('./validation-to-maybe'),
  maybeToValidation: require('./maybe-to-validation'),
  maybeToEither: require('./maybe-to-either'),
  nullableToValidation: require('./nullable-to-validation'),
  nullableToEither: require('./nullable-to-either'),
  nullableToMaybe: require('./nullable-to-maybe')
};

