#Dependent Javascript properties

###Status

Beta. Tests almost complete. Used in a project of mine.

###Introduction

Define dependent Javascript properties for Meteor. See MDN [Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty). Dependent properties are reactive like `Session` or `ReactiveDict`. Reactivity is marked by a prefix in the property name. 

###What is reactive programming?

Reactive programming is one of the more subtle and brilliant concepts of Meteor. It's well explained in the documentation section [Reactivity](https://docs.meteor.com/#reactivity). To give a short summary here: When you retrieve something reactive in a reactive context it is rerun whenever the context gets invalidated. By setting something reactive you can invalidate all it dependent contexts. This happens if you reactively assign to a dependent property with a different value.

###The convention with the prefix

Reactivity can be hard to debug. It helps if code is both concise and obvious about reactivity. To make reactivity obvious a convention to indicate reactivity in properties is proposed. The convention is using a prefix (by default the dollar sign). If the property is prepended with the prefix the access is reactive. For example `obj.$prop` is reactive, and `obj.prop` is not, and both accesses use the same property value.

###Examples

Define a dependent property `a` with the value `alpha` then reactively set it to `alpha2`. Declare a reactive context with `Deps.autorun()` and let it print the current value. Note that the property get in the context must be reactive. This is indicated by the prefix `$`.

    var obj = {}
    Object.defineDepProperty(obj, 'a')
    obj.a = "alpha"
    Deps.autorun(function(c) {
      console.log("Autorun", c.firstRun ? 'first run' : 'rerun', obj.$a) 
    })
    obj.$a = "alpha 2"

Output

    Autorun first run alpha
    Autorun rerun alpha2

Assign `a` non-reactively and output the value.

    obj.a = "alpha 3"
    console.log("a", obj.a)

Output

    a alpha3

Note that the autorun has not been rerun.

###Different reactive prefix

You can use a different prefix by passing an object as a third parameter to
`defineDepProperty()` with an option `prefix`.

Example

    defineDepProperty(obj, 'c', {prefix: 'reactive_'})
    obj.reactive_c = 'gamma'


##Getters

Dependent properties internally use getters. Because they are useful they are also included. You can give a value or a function to calculate a value on each get. There is no setter, that means the property is read-only. In strict mode you get a type error if you try to assign a value. In non-strict mode the assignment is ignored. Once defined the getter cannot be redefined. This is a protection against accidental overwrites.

Usage example:

    var obj = {}
    Object.defineGetter(obj, 'tau', Math.PI * 2)
    Object.defineGetter(obj, 'now', function() { return +new Date })
    console.log(obj.tau) // 6.283185307179586
    console.log(obj.now) // The current time in ms since epoch
