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

const { Left, Right } = require('folktale/data/either/either');


/*~
 * ---
 * category: Converting from nullables
 * stability: experimental
 * authors:
 *   - "@boris-marinov"
 * 
 * type: |
 *   forall a:
 *     (a or None) => Either None a
 */
const nullableToEither = (a) =>
  a != null ? Right(a)
  :/*else*/   Left(a);


module.exports = nullableToEither;
