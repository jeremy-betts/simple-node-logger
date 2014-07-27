/**
 * @class RollingFileAppender
 *
 * roll on size and/or date/time;
 *
 * @author: darryl.west@raincitysoftware.com
 * @created: 7/27/14 9:52 AM
 */
var Logger = require( './Logger' ),
    AbstractAppender = require( './AbstractAppender' ),
    dash = require( 'lodash' ),
    moment = require( 'moment' ),
    fs = require( 'fs' ),
    path = require( 'path' );

var RollingFileAppender = function(options) {
    'use strict';

    var appender = this,
        typeName = options.typeName,
        autoOpen = dash.isBoolean( options.autoOpen ) ? options.autoOpen : true,
        logDirectory = options.logDirectory,
        fileNamePattern = options.fileNamePattern,
        dateFormat = options.dateFormat || 'YYYY.MM.DD',
        level = options.level || Logger.DEFAULT_LEVEL,
        levels = options.levels || Logger.STANDARD_LEVELS,
        currentLevel = levels.indexOf( level ),
        currentFile,
        writers = [];

    if (!typeName) {
        typeName = options.typeName = 'RollingFileAppender';
    }

    AbstractAppender.extend( this, options );

    /**
     * default formatter for this appender;
     * @param entry
     */
    this.formatter = function(entry) {
        var fields = appender.formatEntry( entry );

        fields.push( '\n' );

        return fields.join( appender.separator );
    };

    /**
     * call formatter then write the entry to the console output
     * @param entry - the log entry
     */
    this.write = function(entry) {
        if (levels.indexOf( entry.level ) >= currentLevel) {
            var writer = getWriter();
            if (writer) {
                writer.write( appender.formatter( entry ) );
            } else {
                console.log( 'no writer...' );
            }
        }
    };

    this.checkForRoll = function(now) {
        // check to see if the

    };

    this.createFileName = function(now) {
        var dt;

        if (now || now instanceof moment) {
            dt = now.format( dateFormat );
        } else {
            dt = moment().format( dateFormat );
        }

        return fileNamePattern.replace( /<DATE>/i, dt );
    };

    var getWriter = function() {
        return writers[0];
    };

    var openWriter = function(filename) {
        var writer,
            file,
            opts;

        if (!filename) {
            filename = appender.createFileName();
        }

        file = path.join( logDirectory, filename );
        opts = {
            flags:'a',
            encoding:'utf8'
        };

        writer = fs.createWriteStream( file, opts );

        // make this the current writer...
        writers.unshift( writer );
        currentFile = file;

        if (writers.length > 1) {
            // close the old writer
            writer = writers.pop();
            writer.removeAllListeners();
            writer.end('\n');
        }
    };

    this.__protected = function() {
        return {
            openWriter:openWriter,
            currentFile:currentFile,
            writers:writers
        };
    };

    // constructor tests
    if (!logDirectory) throw new Error('appender must be constructed with a log directory');
    if (!fileNamePattern) throw new Error('appender must be constructed with a file name pattern');

    // now validate the date pattern and file format
    // date may only contain YMDHAa-.

    if (autoOpen) {
        openWriter();
    }
};

module.exports = RollingFileAppender;