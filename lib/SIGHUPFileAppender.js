/**
 * @class SIGHUPFileAppender
 *
 * roll on size and/or date/time;
 *
 * @author: jeremy.betts@freevoiceusa.com
 * @created: 5/13/20 9:52 AM
 */
const Logger = require( './Logger' );
const AbstractAppender = require( './AbstractAppender' );
const dash = require( 'lodash' );
const moment = require( 'moment' );
const path = require( 'path' );

const SIGHUPFileAppender = function(options) {
    'use strict';

    const appender = this;
    const fs = options.fs || require( 'fs' );
    const newline = /^win/.test(process.platform) ? '\r\n' : '\n';

    let typeName = options.typeName,
        autoOpen = dash.isBoolean( options.autoOpen ) ? options.autoOpen : true,
        level = options.level || Logger.DEFAULT_LEVEL,
        levels = options.levels || Logger.STANDARD_LEVELS,
        currentLevel = levels.indexOf( level ),
        logFilePath = options.logFilePath,
        writers = [];

    if (!typeName) {
        typeName = options.typeName = 'SIGHUPFileAppender';
    }

    AbstractAppender.extend( this, options );

    const getWriter = function() {
        return writers[0];
    };

    const openWriter = function(fname) {
        const file = path.normalize( logFilePath );
        const opts = {
            flags:'a',
            encoding:'utf8'
        };

        let writer = fs.createWriteStream( file, opts );

        // make this the current writer...
        writers.unshift( writer );

        // now close the current logger and remove from the writers list
        while (writers.length > 1) {
            // close the old writer
            writer = writers.pop();
            writer.removeAllListeners();
            writer.end('\n');
        }
    };

    /**
     * default formatter for this appender;
     * @param entry
     */
    this.formatter = function(entry) {
        const fields = appender.formatEntry( entry );

        fields.push( newline );

        return fields.join( appender.separator );
    };

    /**
     * call formatter then write the entry to the console output
     * @param entry - the log entry
     */
    this.write = function(entry) {
        if (levels.indexOf( entry.level ) >= currentLevel) {
            const writer = getWriter();
            if (writer) {
                writer.write( appender.formatter( entry ) );
            } else {
                /*eslint no-console: "off"*/
                console.log( 'no writer...' );
            }
        }
    };

    this.setLevel = function(level) {
        const idx = levels.indexOf( level );
        if (idx >= 0) {
            currentLevel = idx;
        }
    };

    this.closeWriter = function(){
        while (writers.length > 0) {
            // close the old writer
            writer = writers.pop();
            writer.removeAllListeners();
            writer.end('\n');
        }
    }

    this.__protected = function() {
        return {
            openWriter:openWriter,
            writers:writers
        };
    };

    // constructor tests
    (function() {
        if (!logFilePath) {
            throw new Error('appender must be constructed with a log file path');
        }
    }());
    

    // now validate the date pattern and file format
    // date may only contain YMDHAa-.

    if (autoOpen) {
        openWriter();
    }
};

module.exports = SIGHUPFileAppender;
