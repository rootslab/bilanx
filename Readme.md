###β Bilanx

[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rootslab/bilanx#mit-license)
[![GITHUB tag](http://img.shields.io/github/tag/rootslab/bilanx.svg)](https://github.com/rootslab/bilanx/tags)
[![ISSUES](http://img.shields.io/github/issues/rootslab/bilanx.svg)](https://github.com/rootslab/bilanx/issues)
[![GITTIP](http://img.shields.io/gittip/rootslab.svg)](https://www.gittip.com/rootslab/)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/bilanx.svg)](http://npm-stat.com/charts.html?package=bilanx)

[![NPM VERSION](http://img.shields.io/npm/v/bilanx.svg)](https://www.npmjs.org/package/bilanx)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/bilanx.svg)](http://travis-ci.org/rootslab/bilanx)
[![BUILD STATUS](http://img.shields.io/david/rootslab/bilanx.svg)](https://david-dm.org/rootslab/bilanx)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/bilanx.svg)](https://david-dm.org/rootslab/bilanx#info=devDependencies)

[![NPM GRAPH1](https://nodei.co/npm-dl/bilanx.png)](https://nodei.co/npm/bilanx/)

[![NPM GRAPH2](h.co/npm/bilanx.png?downloads=true&stars=true)](https://nodei.co/npm/bilanx/)

> _**β Bilanx**_, a __fast and simplified__ command queue for 🂢 __[Deuces](https://github.com/rootslab/deuces)__, a __minimal Redis client__. It is __custom version__ of the  __[♎ Libra](https://github.com/rootslab/libra)__ module, it handles only some commands, primarily pubsub ones and monitor.
> It uses an __automatic rollback mechanism__ for subscriptions, when the connection is lost.
> It is heavily based on __[Train](https://github.com/rootslab/train)__ module, a __well-tested__ and fast __FIFO__ queue.

###Install

```bash
$ npm install bilanx [-g]
// clone repo
$ git clone git@github.com:rootslab/bilanx.git
```
> __install and update devDependencies__:

```bash
 $ cd bilanx/
 $ npm install --dev
 # update
 $ npm update --dev
```
> __require__

```javascript
var Bilanx = require( 'bilanx' );
```
> See [examples](example/).

###Run Tests

```bash
$ cd bilanx/
$ npm test
```

###Run Benchmark

```bash
$ cd bilanx/
$ npm run bench
```
> __NOTE__: You should install _devDependencies_ (_Syllabus_) for running benchmarks.


###Constructor

> Create an instance.

```javascript
var l = Bilanx()
// or
var l = new Bilanx()
```

### Properties

> __WARNING__: Don't mess with these properties.

```javascript
// command queue
Bilanx.cqueue : Train

// status properties
Bilanx.status : {
    subscription : {
        on : 0
        , active : 0
        , channels : 0
        , patterns : 0
    }
    , monitoring : {
        on : 0
        , active : 0
    }
    // it holds special AUTH command
    , auth : []
}
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Update the current auth status property. In this way the AUTH command
 * has priority over the other commands in the queue; when #pop() will be
 * called, it will return this command regardless if the command queue is
 * empty or not.
 *
 * It returns the current auth status property ( encoded AUTH command ).
 *
 * NOTE: only Syllabus AUTH command will be accepted and stored.
 */
Bilanx#auth( Object syllabus_auth_command ) : Object

/*
 * Update internal subscription status ( using a un/subscription reply ), passing the command and
 * the number of current subscribed channels, received as message reply. It returns the total number
 * of subscribed channels and patterns.
 *
 * Examples: Bilanx#update( 'subscribe', 5 ) or Bilanx#update( 'unsubscribe', 3 )
 *
 * NOTE: Except for subscription commands, QUIT is the only command accepted in pubsub mode.
 */
Bilanx#update( subscription_command_reply [, channels_number ] ) : Number

/*
 * Get the total number of channels/patterns in status.subscriptions
 */
Bilanx#subs() : Bilanx

/*
 * Push a Syllabus command to the internal queue.
 * It returns the number of command objects currently in the queue, or -1
 * if the command wasn't allowed/pushed.
 *
 * NOTE: only Syllabus commands are accepted.
 */
Bilanx#push( Object syllabus_command ) : Number

/*
 * Pop a Syllabus command from the internal queue.
 * It pops the current head of the command queue.
 */
Bilanx#pop() : Object

/*
 * Get a element in the command queue without popping it.
 * The default position is 0.
 */
Bilanx#head( [ Number pos ] ) : Object

/*
 * Start rolling up.
 * From now, all items evicted from the queue could be restored, executing #rollBack().
 * Disable rollUp passing false.
 * It returns the current Bilanx instance.
 */
Bilanx#rollUp( [ Boolean on ] ) : Bilanx

/*
 * Do rollback; previously evicted items are restored to the head of queue.
 * Optionally, it is possible to re-enable rollUp mechanism after the rollBack,
 * passing true.
 * It returns the current Bilanx instance.
 * 
 * NOTE: no rollBack will be done if rollUp was not already activated.
 */
Bilanx#rollBack( [ Boolean on ] ) : Bilanx

/*
 * Apply a fn to every element of the internal command queue;
 * fn will get 3 arguments: Object element, Number index, Function done.
 * After that every fn will have called done(), the callback will be launched
 * with an err argument ( if any has occurred ) and a number, representing
 * the total processed / iterated elements in the queue.
 *
 * If boolean "evict" was set to true, after the last fn call to done(),
 * the queue will be flushed.
 *
 * NOTE: when queue size is 0, the callback will be immediately executed
 * with arguments: ( null, 0 ).
 *
 * NOTE: on iteration, the size is fixed to the current queue size,
 * then it is possible to push other elements to the tail, these
 * added elements are not affected by iteration.
 */
Bilanx#iterate( Function fn [, Object scope [, Function cback [, Boolean evict ] ] ] ) : Bilanx

/*
 * Flush the internal queue, reset all internal status properties,
 * then disable rollback mechanism.
 * It returns the current Bilanx instance.
 */
Bilanx#flush() : Bilanx

/*
 * Reset all internal status properties, then disable rollback mechanism.
 * It returns the current Bilanx instance.
 */
Bilanx#reset() : Bilanx
```
------------------------------------------------------------------------


### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
