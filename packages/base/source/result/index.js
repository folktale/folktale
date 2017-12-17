//----------------------------------------------------------------------
//
// This source file is part of the Folktale project.
//
// Licensed under MIT. See LICENCE for full licence information.
// See CONTRIBUTORS for the list of contributors to the project.
//
//----------------------------------------------------------------------

const Result = require('./result');
const { typeSymbol } = require('folktale/adt/union/union');


/*~
 * stability: stable
 * name: module folktale/result
 */
module.exports = {
  Error: Result.Error,
  Ok: Result.Ok,
  hasInstance: Result.hasInstance,
  of: Result.of,
  fromJSON: Result.fromJSON,
  [typeSymbol]: Result[typeSymbol],
  try: require('./try'),

  /*~
   * type: |
   *   forall a, b: (a or None, b) => Result b a
   *   | (a or None) => Result None a
   */
  fromNullable(aNullable, fallbackValue) {
    const nullableToResult = require('folktale/conversions/nullable-to-result');

    if (arguments.length > 1) {  // eslint-disable-line prefer-rest-params 
      return nullableToResult(aNullable, fallbackValue);
    } else {
      return nullableToResult(aNullable);
    }
  },

  /*~
   * type: |
   *   forall a, b: (Validation a b) => Result a b
   */
  fromValidation(aValidation) {
    return require('folktale/conversions/validation-to-result')(aValidation);
  },

  /*~
   * type: |
   *   forall a, b: (Maybe b, a) => Result a b
   */
  fromMaybe(aMaybe, failureValue) {
    return require('folktale/conversions/maybe-to-result')(aMaybe, failureValue);
  }
};
