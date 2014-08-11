/* 
 * Bilanx Example
 */

var log = console.log
    , util = require( 'util' )
    , Bilanx = require( '../' )
    , b = Bilanx()
    ;
log( util.inspect( b, false, 3, true ) );