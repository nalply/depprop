#Dependent Javascript properties

Define dependent JavaScript properties for Meteor. It's like Sessions.

The property is reactive if you use the prefix (the dollar sign), but it is not if you omit the prefix. `object.$prop` is reactive, and `object.prop` is the same but non-reactive.

Reactivity can be hard to debug. It helps if one sees immediately where reactive accesses happen. The prefix is conspicuous and indicates reactive accesses easily. See below to use a different prefix.

###Status

Alpha. No tests.

Example:

    var object = {}
    defineDepProperty(object, 'a')
    object.a = "alpha"
    Deps.autorun(function() { console.log("First autorun", object.$a) })
    object.$a = "alpha 2"

 Console output:

    First autorun alpha
    First autorun alpha2

Example continued:

    defineDepProperty(object, 'b')
    object.b = 42
    Deps.autorun(function() { 
      object.$a = object.$b + 1 
      console.log("Second autorun", object.a, object.b)
    })
    object.$b = 41

Console output:

    Second autorun 43 42
    First autorun 43
    Second autorun 42 41
    First autorun 42

Example continued:

    object.a = 41
    object.$b = 40

Console output:

    Second autorun 41 40

You can use a different prefix by passing an object as a third parameter to
`defineDepProperty()` with an option `reactivePrefix`.

Example:

    defineDepProperty(object, 'c', {reactivePrefix: 'reactive_'})
    object.reactive_c = 'gamma'


##Read-only getter

Dependent properties internally use read-only getters. 

Usage example:

    var object = {}
    defineGetter(object, 'tau', Math.PI * 2)
    defineGetter(object, 'now', function() { return +new Date })
    console.log(object.tau) // 6.283185307179586
    console.log(object.now) // The current time in ms since epoch
