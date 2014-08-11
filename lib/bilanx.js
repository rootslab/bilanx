/*
 * β Bilanx, module to handle bindings between commands and Redis replies,
 * for Deuces, a minimal Redis client.
 * Moreover, it implements an automatic rollback mechanism for subscriptions when the
 * connection goes down.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Bilanx = ( function () {
    var Bolgia = require( 'bolgia' )
        , doString = Bolgia.doString
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , ooo = Bolgia.circles
        , oobj = ooo.obj
        , oarr = ooo.arr
        , Train = require( 'train' )
        , reset = function ( obj ) {
            var h = obj || {}
                , p = null
                , type = null
                ;
            for ( p in h ) {
                type = doString( h[ p ] );
                if ( type === oobj ) {
                    reset( h[ p ] );
                    continue;
                }
                if ( type === oarr ) {
                    h[ p ] = [];
                    continue;
                }
                h[ p ] = 0;
            }
        }
        , sendError = function ( ocmd, emsg ) {
            var err = new Error( emsg )
                ;
            ocmd.err = err;
            // execute callback
            ocmd.zn( true, err.message, ocmd.fn );
            return -1;
        }
        , bilanx_opt = {
            timestamps : false
            , rollback : 64 * 1024
        }
        // Bilanx
        , Bilanx = function ( opt ) {
            var me = this
                , is = me instanceof Bilanx
                ;
            if ( ! is ) return new Bilanx();
            // set options
            me.options = improve( clone( opt ), bilanx_opt );
            // set internal queue with limits
            me.cqueue = Train( {
                rlim : 64 * 1024
                , xlim : Infinity
            } );
            // set internal status
            me.status = {
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
                , auth : []
                , last_access : 0
            }
            ;
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
            , ocmd = doString( cmd ) === oobj ? cmd : null
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
            ;

        if ( ocmd.isQuit ) return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
        if ( m.on ) return sendError( ocmd, 'only the QUIT command is allowed in monitor mode.' );
        if ( s.on ) {
            // Redis >= 2.8.x permits PING in pubsub mode
            if ( ocmd.isPing ) return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
            if( ! ocmd.isSubscription ) return sendError( ocmd, cname + ' command is not allowed in PubSub mode.' );
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
            , status =  me.status
            , tstamp = me.options,timestamps
            , auth = status.auth[ 0 ]
            ;
        // update last access_time
        if ( tstamp ) status.last_access = Date.now();
        return auth ? auth : me.cqueue.get( + pos || 0 );
    };

    bproto.pop = function () {
        var me = this
            , status = me.status
            , m = status.monitoring
            , s = status.subscription
            , tstamp = me.options,timestamps
            , auth = status.auth[ 0 ]
            , cqueue = me.cqueue
            // get auth command if exists or current command enqueued
            , curr = cqueue.get( 0 )
            ;
        // update last access_time
        if ( tstamp ) status.last_access = Date.now();
        // check auth
        if ( auth ) {
            // return stored command AUTH and reset status property
            status.auth = [];
            return auth;
        }
        // if no cmd was queued, a message was received
        if ( ! curr ) return;
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
            if ( ! cqueue.roll ) cqueue.rollUp( true );
            /*
             * check if (P)UNSUBSCRIBE without arguments, set the
             * expectedMessages property to active channels or patterns.
             */
            if ( curr.bulks === 1 ) curr.expectedMessages = curr.isUnsubscribe ? 
               ( s.channels ? s.channels : 0 ) :
               ( curr.isPunsubscribe ? ( s.patterns ? s.patterns : 0 ) : 0 )
               ;
            // check for expected messages, don't pop command if !== 0
            if ( curr.expectedMessages ) return --curr.expectedMessages ? curr : cqueue.shift();
        }
        return cqueue.shift();
    };

    bproto.subs = function () {
        var me = this
            , s = me.status.subscription
            ;
        return s.on ? s.channels + s.patterns : 0;
    };

    bproto.update = function ( scmd, total_curr_subs ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , tot = s.channels + s.patterns
            ;
        switch ( scmd ) {  
            case 'subscribe':
                if ( tot < total_curr_subs ) ++s.channels;
            break;
            case 'unsubscribe':
                if ( tot > total_curr_subs ) --s.channels;
            break;
            case 'psubscribe':
                if ( tot < total_curr_subs ) ++s.patterns;
            break;
            case 'punsubscribe':
                if ( tot > total_curr_subs ) --s.patterns;
            break;
            default:
            break;
        };
        tot = s.channels + s.patterns;
        s.active = s.on = + !! tot;
        // disable rollUp if pubsub mode is off
        if ( ! s.active ) me.rollUp( false );
        return tot;
    };

    //  fn, scope, cback, evict
    bproto.iterate = function () {
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