//----------------------------------------------------------------------
//
// This source file is part of the Folktale project.
//
// See LICENCE for licence information.
// See CONTRIBUTORS for the list of contributors to the project.
//
//----------------------------------------------------------------------

module.exports = (methodName) => (result) => {
  console.warn(`Type.${methodName}() is being deprecated in favour of Type['fantasy-land/${methodName}'](). 
    Your data structure is using the old-style fantasy-land methods,
    and these won't be supported in Folktale 3`)
  return result
}
