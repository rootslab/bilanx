/*
 * β Bilanx, module to handle bindings between commands and Redis replies,
 * for Deuces, a minimal Redis client.
 * Moreover, it uses an automatic rollback mechanism for subscriptions.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Bilanx = ( function () {
    var log = console.log
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , toString = Bolgia.toString
        , ooo = Bolgia.circles
        , oobj = ooo.obj
        , oarr = ooo.arr
        , Train = require( 'train' )
        , reset = function ( obj ) {
            var me = this
                , h = obj || {}
                , p = null
                , type = null
                ;
            for ( p in h ) {
                type = toString( h[ p ] );
                if ( type === oobj ) {
                    reset( h[ p ] );
                    continue;
                }
                if ( type === oarr ) {
                    h[ p ] = [];
                    continue;
                }
                h[ p ] = 0;
            };
        }
        , sendError = function ( ocmd, emsg ) {
            var err = new Error( emsg )
                ;
            ocmd.err = err;
            // execute callback
            ocmd.zn( true, err.message, ocmd.fn );
            return -1;
        }
        // Bilanx
        , Bilanx = function () {
            var me = this
                ;
            if ( ! ( me instanceof Bilanx ) ) {
                return new Bilanx();
            }
            me.cqueue = Train();
            me.status = {
                subscription : {
                    on : 0
                    , active : 0
                    , channels : 0
                }
                , monitoring : {
                    on : 0
                    , active : 0
                }
                , auth : []
            };
        }
        , bproto = Bilanx.prototype
        ;

    bproto.flush = function () {
        var me = this
            , cqueue = me.cqueue
            , status = me.status
            ;
        cqueue.flush();
        reset( status );
        cqueue.rollUp( false );
        return me;
    };

    bproto.rollBack = function ( bool ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.rollBack( bool );
        return me;
    };

    bproto.rollUp = function ( bool ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.rollUp( bool );
        return me;
    };

    bproto.auth = function ( cmd ) {
        var me = this
            , ocmd = toString( cmd ) === oobj ? cmd : null
            ;
        return ( me.status.auth.push( ocmd ) && ocmd.isAuth ) ? ocmd : null;
    };

    bproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , m = status.monitoring
            , cqueue = me.cqueue
            , cname = ocmd.cmd
            , err = null
            ;
        if ( ! ocmd.isQuit ) {
            if ( m.on ) return sendError( ocmd, 'only the QUIT command is allowed in monitor mode.' );
            // Redis >= 2.8.x permits PING in pubsub mode
            if ( ocmd.isPing ) return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
            if ( s.on && ! ocmd.isSubscription ) return sendError( ocmd, cname + ' command is not allowed in PubSub mode.' );
        }
        if ( ocmd.isMonitor ) m.on = 1;
        else if ( ocmd.isSubscription ) s.on = 1;
        /*
         * There is only a single argument to push, use
         * the faster way to do it, instead of using
         * cqueue.push( ocmd ). See Train#fpush.
         */
        return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
    };

    bproto.head = function ( pos ) {
        var me = this
            , auth = me.status.auth[ 0 ]
            ;
        return auth ? auth : me.cqueue.get( + pos || 0 );
    };

    bproto.pop = function () {
        var me = this
            , status = me.status
            , m = status.monitoring
            , s = status.subscription
            , auth = status.auth[ 0 ]
            , cqueue = me.cqueue
            // get auth command if exists or current command enqueued
            , curr = cqueue.get( 0 )
            ;
        if ( auth ) {
            // return stored command AUTH and reset status property
            status.auth = [];
            return auth;
        }
        if ( ! curr ) {
            // if no cmd was queued, a message was received
            return;
        }
        if ( curr.isQuit ) {
            /*
             * QUIT command, reset internal status
             * and disable the rollUp mechanism.
             */
            reset( status );
            cqueue.rollUp( false );
            return cqueue.shift();
        }
        if ( m.active || curr.isMonitor ) {
            m.active = 1;
            // return the current command or undefined
            return cqueue.shift();
        }
        if ( curr.isSubscription ) {
            s.active = 1;
            // enable rollUp only if it is not yet activated
            if ( ! cqueue.roll ) {
                cqueue.rollUp( true );
            }
            // check for expected messages, don't pop command if !== 0
            if ( curr.expectedMessages ) {
                return --curr.expectedMessages ? curr : cqueue.shift();
            }
        }
        return cqueue.shift();
    };

    bproto.subs = function () {
        var me = this
            , s = me.status.subscription
            ;
        return s.on ? s.channels : 0;
    };

    bproto.update = function ( scmd, channels ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , tot = -1
            ;
        if ( scmd.match( /^(p|pun|un)?subscribe$/gi ) !== null ) {
            s.channels = channels;
        }
        tot = s.channels;
        s.active = s.on = + !! tot;
        // disable rollUp if pubsub mode is off
        if ( ! s.active ) me.rollUp( false );
        return tot;
    };

    bproto.iterate = function ( fn, scope, cback, evict ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.iterate.apply( cqueue, arguments );
        return me;
    };

    bproto.reset = function () {
        var me = this
            ;
        reset( me.status );
        return me;
    };

    return Bilanx;

} )();