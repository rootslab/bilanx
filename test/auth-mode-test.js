/* 
 * Bilanx AUTH mode
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
    ;

log( '- push dummy PING command to the queue.' );
l.push( pcmd );

log( '- call Bilanx#auth with encoded AUTH command.' );
l.auth( acmd );

log( '- check if status property was correctly updated.' );
assert.ok( l.status.auth[ 0 ] === acmd );

log( '- call Bilanx#pop, result should be AUTH command and not PING.' );
assert.ok( l.pop() === acmd );

log( '- now Bilanx.status.auth should be resetted to 0.' );
assert.deepEqual( l.status.auth, [] );