#!/usr/bin/env node

/* 
 * Bilanx status reset test
 */

exports.test = function ( done ) {

    var log = console.log
        , emptyFn = function () {}
        , assert = require( 'assert' )
        , util = require( 'util' )
        , Bilanx = require( '../' )
        , Syllabus = require( 'syllabus' )
        , l = Bilanx()
        , syl = Syllabus()
        , ping = syl.commands.ping()
        , status = {
            subscription : {
                on : 0
                , channels : 0
                , pchannels : 0
            }
            , monitoring : {
                on : 0
                , active : 0
            }
            , auth : 0
        }
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- #push a PING command to the queue.' );
    l.push( ping );

    log( '- hack Bilanx status properties.' );
    l.status = {
        subscription : {
            on : 1
            , channels : 1
            , pchannels : 1
        }
        , monitoring : {
            on : 1
            , active : 1
        }
        , auth : 1
    };

    log( '- Bilanx#flush.' );
    l.flush();

    log( '- Bilanx internal queue size should be 0.' );
    assert.equal( l.cqueue.size(), 0 );

    log( '- check if all status properites are correctly resetted.' );
    assert.deepEqual(l.status, status );

    exit();
};