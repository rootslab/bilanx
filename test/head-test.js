/* 
 * Bilanx #head method
 */

var log = console.log
    , emptyFn = function () {}
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Bilanx = require( '../' )
    , Syllabus = require( 'syllabus' )
    , l = Bilanx()
    , syl = Syllabus()
    , auth = syl.commands.auth
    , ping = syl.commands.ping
    , acmd = auth( 'foobared', emptyFn )
    , pcmd = ping()
    , h = null
    , p = null
    ;

log( '- push dummy PING command to the queue.' );
l.push( pcmd );

h = l.head();
p = l.pop();

log( '- now compare #pop and #head result, should be the same command:', util.inspect( p, false, 3 , true )  );
assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

log( '- re-push dummy PING command to the queue.' );
l.push( pcmd );

log( '- call #auth to push AUTH command into the queue.' );
l.auth( acmd );

log( '- check if status.auth  property was correctly updated.' );
assert.ok( l.status.auth[ 0 ] === acmd );

h = l.head();
p = l.pop();

log( '- now compare #pop and #head result, should be the same command (not PING):', util.inspect( p, false, 3 , true )  );
assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

log( '- now Bilanx.status.auth should be resetted to 0.' );
assert.deepEqual( l.status.auth, [] );


h = l.head();
p = l.pop();

log( '- now compare #pop and #head result, should be the same command (not PING):', util.inspect( p, false, 3 , true )  );
assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

log( '- now #pop PING command from the queue.' );

h = l.head();
p = l.pop();

log( '- now compare #pop and #head result, should be the same command (PING):', util.inspect( p, false, 3 , true )  );
assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );