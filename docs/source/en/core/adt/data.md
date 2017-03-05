@annotate: folktale.core.adt.data
seeAlso:
  - type  : link
    title : "Designing with types: Making illegal states unrepresentable"
    url   : http://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/
---
Constructs a tagged union data structure.


## Using the ADT module::

    const data = require('folktale/core/adt/data');

    var List = data('List', {
      Nil(){ },
      Cons(value, rest) {
        return { value, rest };
      }
    });

    var { Nil, Cons } = List;

    Cons('a', Cons('b', Cons('c', Nil())));
    // ==> { value: 'a', rest: { value: 'b', ..._ }}



## Why use tagged unions?

Data modelling is a very important part of programming, directly
affecting things like correctness and performance. Folktale is
in general mostly interested in correctness, and providing tools
for achieving that.

When modelling data in a program, there are several different
choices that one must make in an attempt to capture the rules of
how that data is manipulated and what they represent. Data modeling
tends to come in three different concepts:

  - **Scalars** represent concepts that have only one atomic
    value at a time. This value makes sense on its own, and can't
    be divided into further concepts. Examples of this are numers,
    strings, etc.

  - **Product** represent bigger concepts that are made out of
    possibly several smaller concepts, each of which is independent
    of each other, and always present. An object that contains a
    person's `name` and `age` is an example of a product, arrays
    are another example.

  - **Unions** represent one of out of many concepts, at any given
    time. JS doesn't have many data structure that captures the idea
    of an union, but there are many cases where this happens in a
    codebase: 

      - Reading a file may either give you the data in that
        file or an error object; 

      - Accessing a property in an object may either give you the
        value or undefined;

      - Querying a database may give you a connection error (maybe
        we weren't able to contact the database), a query error
        (maybe the query wasn't well formed), a "this value isn't
        here" response, or the value you want.

Out of these, you're probably already familiar with products and scalars,
because they're used everywhere in JavaScript, but maybe you're not
familiar with unions, since JavaScript doesn't have many of them built-in.

For example, when reading a file in Node, you have this:

    fs.readFile(filename, (error, value) => {
      if (error != null) {
        handleError(error);
      } else {
        handleSuccess(value);
      }
    });

The callback function receives two arguments, `error` and `value`, but
only one of them may ever be present at any given time. If you have a
value, then `error` must be null, and if you have an error, then `value`
must be null. Nothing in the representation of this data tells you
that, or forces you to deal with it like that.

If you compare it with an API like `fetch`, where you get a Promise
instead, many of these problems are solved:

    fetch(url).then(
      (response) => handleSuccess(response),
      (error)    => handleError(error)
    );

Here the result of `fetch` can be either a response or an error, like in
the `readFile` example, but the only way of getting to that value is
through the `then` function, which requires you to define separate branches
for handling each case. This way it's not possible to forget to deal with
one of the cases, or make mistakes in the branching condition, such as
`if (error == null) { handleError(...) }` — which the first version of
this documentation had, in fact.


## Modelling data with Core.ADT

So, properly modelling your data helps making sure that a series of errors
can't ever occurr in your program, which is great as you have to deal with
less problems, but how does Core.ADT help you in that?


### A simple failure case

To answer this question let's consider a very simple, everyday problem: you
have a function that can return any value, but it can also fail. How do you
differentiate failure from regular values?

::

    const find = (predicate, items) => {
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        if (predicate(item))  return item;
      }
      return null;
    };

The example above returns the item if the predicate matches anything, or `null`
if it doesn't. But `null` is also a valid JavaScript value::

    find(x => true, [1, 2, 3]);    // ==> 1
    find(x => false, [1, 2, 3]);   // ==> null
    find(x => true, [null, 1, 2]); // ==> null

Now, there isn't a way of differentiating failure from success if your arrays
have a `null` value. One could say "this function works for arrays without
nulls", but there isn't a separate type that can enforce those guarantees
either. This confusing behaviour opens the door for bugs that are very
difficult to find, since they're created way before they hit the `find`
function.

A more practical approach is to return something that can't be in the array.
For example, if we return an object like: `{ found: Bool, value: Any }`, then
we don't run into this issue::

    const find2 = (predicate, items) => {
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        if (predicate(item))  return { found: true, value: item };
      }
      return { found: false };
    };

    find2(x => true, [1, 2, 3]);    // ==> { found: true, value: 1 }
    find2(x => false, [1, 2, 3]);   // ==> { found: false }
    find2(x => true, [null, 1, 2]); // ==> { found: true, value: null }

We can differentiate between successes and failures now, but in order to
use the value we need to unpack it. Now we have two problems: `found` and
`value` aren't entirely related, and we have to create this ad-hoc relationship
through an `if` statement. That's very easy to get wrong. Another problem is
that nothing forces people to check `found` before looking at `value`.

So, a better solution for this is to use tagged unions and pattern matching::

    const data = require('folktale/core/adt/data');

    const Maybe = data('Maybe', {
      None() { return {} },
      Some(value) { return { value } }
    });

    const find3 = (predicate, items) => {
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        if (predicate(item))  return Maybe.Some(item);
      }
      return Maybe.None();
    };

    find3(x => true, [1, 2, 3]);    // ==> Maybe.Some(1)
    find3(x => false, [1, 2, 3]);   // ==> Maybe.None()
    find3(x => true, [null, 1, 2]); // ==> Maybe.Some(null)

    find3(x => true, [1, 2, 3]).matchWith({
      None: ()          => "Not found",
      Some: ({ value }) => "Found " + value
    }); // ==> "Found 1"


### Modelling complex cases

Let's consider a more complex case. Imagine you're writing a function to
handle communicating with some HTTP API. Like in the case presented in
the previous section, a call to the API may succeed or fail. Unlike the
previous example, here a failure has more information associated with it,
and we can have different kinds of failures:

  - The operation may succeed, and return a value;
  - The operation may fail:
    - Because it wasn't possible to reach the API (due to a network error, for example);
    - Because the return value of the API wasn't in the expected format (unable to parse);
    - Because the API itself returned an error (e.g.: if the request had bad data in it).

A common way of writing this in Node would be like this:

    api.method((error, response) => {
      if (error != null) {
        if (error.code === "http") {
          // handle network failures here
        }
        if (error.code === "service") {
          // handle service failures here
        } 
      } else {
        try {
          var data = normalise(response);
          // handle success here 
        } catch(e) { 
          // handle invalid responses here
        }
      }
    });

But again, in this style of programming it's easier to make mistakes that are hard
to catch, since we're assigning meaning through control flow in an ad-hoc manner,
and there's nothing to tell us if we've got it wrong. It's also harder to abstract,
because we can't capture these rules as data, so we have to add even more special
control flow structures to handle the abstractions.

Let's model it as a tagged union instead. We could make a single data structure
that captures all 4 possible results, and that would be a reasonable way of modelling
this. But on the other hand, we wouldn't be able to talk about failures *in general*,
because this forces us to handle each failure case independently. Instead we'll have
two tagged unions::

    const data = require('folktale/core/adt/data');

    const Result = data('Result', {
      Ok(value) {
        return { value }; 
      },
      Error(reason) {
        return { reason };
      }
    });

    const APIError = data('APIError', {
      NetworkError(error){
        return { error };
      },
      ServiceError(code, message) {
        return { code, message };
      },
      ParsingError(error, data) {
        return { error, data };
      }
    });

Then we can construct these values in the API, and make sure people will handle
all cases when using it:

    function handleError(error) {
      error.matchWith({
        NetworkError: ({ error }) => { ... },
        ServiceError: ({ code, message }) => { ... },
        ParsingError: ({ error, data }) => { ... }
      })
    }

    api.method(response => {
      response.matchWith({
        Error: ({ reason }) => handleError(reason),
        Ok:    ({ value })  => { ... }
      })
    });


## Providing common functionality

When you're modelling data with ADTs it's tempting to create a lot of
very specific objects to capture correctly all of the choices that may
exist in a particular domain, but Core.ADT only gives you construction
and pattern matching, so what if you want your types to have a notion
of equality?

That's where the concept of *derivation* comes in. A derivation is a
function that provides a set of common functionality for an ADT and
its variants. For example, if one wanted to add the notion of equality
to an ADT, they could `derive` `Equality` as follows::

    const data = require('folktale/core/adt/data');
    const Equality = require('folktale/core/adt/derivations/equality');

    const Either = data('Either', {
      Left(value) { return { value } },
      Right(value){ return { value } }
    }).derive(Equality);

Note the `.derive(Equality)` invocation. `derive` is a method that can
be called at any time on the ADT to provide new common functionality
to it. In this case, the `Equality` derivation gives all variants an
`equals()` method::

    Either.Left(1).equals(Either.Left(1));   // ==> true
    Either.Left(1).equals(Either.Right(1));  // ==> false
    Either.Right(1).equals(Either.Right(2)); // ==> false
    Either.Right(2).equals(Either.Right(2)); // ==> true
    
While Core.ADT provides a set of common derivations (categorised
`Derivation` in the documentation), one may create their own derivation
functions to use with Folktale's ADTs. See the [Extending ADTs](#extending-adts)
section for details.
 

## Architecture

The ADT module approaches this problem in a structural-type-ish way, which
happens to be very similar to how OCaml's polymorphic variants work, and
how different values are handled in untyped languages.

In essence, calling `data` with a set of patterns results in the creation
of N constructors, each with a distinct **tag**.

Revisiting the previous `List` ADT example, when one writes:

    const data = require('folktale/core/adt/data');

    var List = data('List', {
      Nil:  () => {},
      Cons: (value, rest) => ({ value, rest })
    })

That's roughly equivalent to the idiomatic:

    var List = {};

    function Nil() { }
    Nil.prototype = Object.create(List);

    function Cons(value, rest) {
      this.value = value;
      this.rest  = rest;
    }
    Cons.prototype = Object.create(List);

The `data` function takes as arguments a type identifier (which can be any
object, if you want it to be unique), and an object with the variants. Each
property in this object is expected to be a function that returns the
properties that'll be provided for the instance of that variant.

The given variants are not returned directly. Instead, we return a wrapper
that will construct a proper value of this type, and augment it with the
properties provided by that variant initialiser.


## Reflection

The ADT module relies on JavaScript's built-in reflective features first,
and adds a couple of additional fields to this.


### Types and Tags

The provided type for the ADT, and the tag provided for the variant
are both reified in the ADT structure and the constructed values. These
allow checking the compatibility of different values structurally, which
sidesteps the problems with realms.

The type of the ADT is provided by the global symbol `@@folktale:adt:type`::

    const data = require('folktale/core/adt/data');

    var Id = data('Identity', { Id: () => {} });
    Id[Symbol.for('@@folktale:adt:type')]
    // ==> 'Identity'

The tag of the value is provided by the global symbol `@@folktale:adt:tag`::

    var List = data('List', {
      Nil: () => {},
      Cons: (h, t) => ({ h, t })
    });
    List.Nil()[Symbol.for('@@folktale:adt:tag')]
    // ==> 'Nil'

These symbols are also exported as properties of the `data` function
itself, so you can use `data.typeSymbol` and `data.tagSymbol` instead
of retrieving a symbol instance with the `Symbol.for` function.


### `is-a` tests

Sometimes it's desirable to test if a value belongs to an ADT or
to a variant. Out of the box the structures constructed by ADT
provide a `hasInstance` check that verify if a value is structurally
part of an ADT structure, by checking the Type and Tag of that value.

###### checking if a value belongs to an ADT::

    const data = require('folktale/core/adt/data');

    var IdA = data('IdA', { Id: (x) => ({ x }) });
    var IdB = data('IdB', { Id: (x) => ({ x }) });

    IdA.hasInstance(IdA.Id(1))  // ==> true
    IdA.hasInstance(IdB.Id(1))  // ==> false


###### checking if a value belongs to a variant::

    const data = require('folktale/core/adt/data');

    var Either = data('Either', {
      Left:  value => ({ value }),
      Right: value => ({ value })
    });
    var { Left, Right } = Either;

    Left.hasInstance(Left(1));  // ==> true
    Left.hasInstance(Right(1)); // ==> false


Note that if two ADTs have the same type ID, they'll be considered
equivalent by `hasInstance`. You may pass an object (like
`Symbol('type name')`) to `data` to avoid this, however reference
equality does not work across realms in JavaScript.

Since all instances inherit from the ADT and the variant's prototype
it's also possible to use `proto.isPrototypeOf(instance)` to check
if an instance belongs to an ADT by reference equality, rather than
structural equality.


## Extending ADTs

Because all variants inherit from the ADT namespace, it's possible
to provide new functionality to all variants by simply adding new
properties to the ADT::

    const data = require('folktale/core/adt/data');

    var List = data('List', {
      Nil:  () => {},
      Cons: (value, rest) => ({ value, rest })
    });

    var { Nil, Cons } = List;

    List.sum = function() {
      return this.matchWith({
        Nil:  () => 0,
        Cons: ({ value, rest }) => value + rest.sum()
      });
    };

    Cons(1, Cons(2, Nil())).sum();
    // ==> 3

A better approach, however, may be to use the `derive` function from
the ADT to provide new functionality to every variant. `derive` accepts
many derivation functions, which are just functions taking a variant and
and ADT, and providing new functionality for that variant.

If one wanted to define a JSON serialisation for each variant, for example,
they could do so by using the `derive` functionality::

    function ToJSON(variant, adt) {
      var { tag, type } = variant;
      variant.prototype.toJSON = function() {
        var json = { tag: `${type}:${tag}` };
        Object.keys(this).forEach(key => {
          var value = this[key];
          if (value && typeof value.toJSON === "function") {
            json[key] = value.toJSON();
          } else {
            json[key] = value;
          }
        });
        return json;
      }
    }

    var List = data('List', {
      Nil:  () => {},
      Cons: (value, rest) => ({ value, rest })
    }).derive(ToJSON);

    var { Nil, Cons } = List;

    Nil().toJSON()
    // ==> { tag: "List:Nil" }

    Cons(1, Nil()).toJSON()
    // ==> { tag: "List:Cons", value: 1, rest: { "tag": "List:Nil" }}


@annotate: folktale.core.adt.data.ADT
---
The basis of all algebraic data types.

ADT is used basically to share some methods for refining data structures
created by this module, derivation being one of them.


@annotate: folktale.core.adt.data.ADT.derive
---
Allows a function to provide functionality to variants in an ADT.

The `derive` method exists to support meta-programming on ADT objects,
such that additional functionality (implementation of interfaces or
protocols, for example) may be provided by libraries instead of having
to be hand-coded by the user.

The operation accepts many `derivation` functions, which will be invoked
for each variant in the ADT, where a Variant is just an object with the
following attributes:

    interface Variant(Any...) -> 'a <: self.prototype {
      tag         : String,
      type        : Any,
      constructor : Constructor,
      prototype   : Object
    }

