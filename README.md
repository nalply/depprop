#Dependent Javascript properties

###Status

Beta. Tests not complete.

###Introduction

Define dependent JavaScript properties for Meteor. It's like Sessions.

The property is reactive if you use the prefix (the dollar sign), but it is not if you omit the prefix. `obj.$prop` is reactive, and `obj.prop` is the same but non-reactive.

Reactivity can be hard to debug. It helps if one sees immediately where reactive accesses happen. The prefix is conspicuous and indicates reactive accesses easily. See below to use a different prefix.

###Examples

Define a dependent property `a` with the value `alpha` then reactively set it to `alpha2`.

    var obj = {}
    Object.defineDepProperty(obj, 'a')
    obj.a = "alpha"
    Deps.autorun(function(c) {
      console.log("Autorun 1", c.firstRun ? 'first run' : 'rerun', obj.$a) 
    })
    obj.$a = "alpha 2"

Output

    Autorun 1 first run alpha
    Autorun 1 rerun alpha2

Define a dependent property `b` and an autorun where the dependent property `a` is set from `b`. This means, when one assigns `b`, the first autorun should also be rerun.

    Object.defineDepProperty(obj, 'b')
    obj.b = 42
    Deps.autorun(function(c) { 
      obj.$a = obj.$b + 1 
      console.log("Autorun 2", c.firstRun ? 'first run' : 'rerun', obj.a, obj.b)
    })
    obj.$b = 41

Output

    Autorun 2 first run 43 42
    Autorun 1 rerun 43
    Autorun 2 rerun 42 41
    Autorun 1 rerun 42

Show the difference between setting non-reactively and reactively.

    obj.a = 41
    obj.$b = 40

Output

    Second autorun 41 40



###Different reactive prefix

You can use a different prefix by passing an object as a third parameter to
`defineDepProperty()` with an option `reactivePrefix`.

Example

    defineDepProperty(obj, 'c', {reactivePrefix: 'reactive_'})
    obj.reactive_c = 'gamma'


##Read-only getter

Dependent properties internally use read-only getters. 

Usage example:

    var obj = {}
    Object.defineReadOnlyGetter(obj, 'tau', Math.PI * 2)
    Object.defineReadOnlyGetter(obj, 'now', function() { return +new Date })
    console.log(obj.tau) // 6.283185307179586
    console.log(obj.now) // The current time in ms since epoch
