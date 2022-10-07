//#region @backend
import { FileLoggerOptions, LoggerOptions } from "./LoggerOptions"
import appRootPath from "app-root-path"
import { QueryRunner } from "../query-runner/QueryRunner"
import { Logger } from "./Logger"
import { PlatformTools } from "../platform/PlatformTools"

/**
 * Performs logging of the events in TypeORM.
 * This version of logger logs everything into ormlogs.log file.
 */
export class FileLogger implements Logger {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        private options?: LoggerOptions,
        private fileLoggerOptions?: FileLoggerOptions,
    ) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (
            this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("query") !== -1)
        ) {
            const sql =
                query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "")
            this.write("[QUERY]: " + sql)
        }
    }

    /**
     * Logs query that is failed.
     */
    logQueryError(
        error: string,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        if (
            this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("error") !== -1)
        ) {
            const sql =
                query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "")
            this.write([`[FAILED QUERY]: ${sql}`, `[QUERY ERROR]: ${error}`])
        }
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        const sql =
            query +
            (parameters && parameters.length
                ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                : "")
        this.write(`[SLOW QUERY: ${time} ms]: ` + sql)
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (
            this.options === "all" ||
            (Array.isArray(this.options) &&
                this.options.indexOf("schema") !== -1)
        ) {
            this.write(message)
        }
    }

    /**
     * Logs events from the migrations run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        this.write(message)
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(
        level: "log" | "info" | "warn",
        message: any,
        queryRunner?: QueryRunner,
    ) {
        switch (level) {
            case "log":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("log") !== -1)
                )
                    this.write("[LOG]: " + message)
                break
            case "info":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("info") !== -1)
                )
                    this.write("[INFO]: " + message)
                break
            case "warn":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("warn") !== -1)
                )
                    this.write("[WARN]: " + message)
                break
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Writes given strings into the log file.
     */
    protected write(strings: string | string[]) {
        strings = Array.isArray(strings) ? strings : [strings]
        const basePath = appRootPath.path + "/"
        let logPath = "ormlogs.log"
        if (this.fileLoggerOptions && this.fileLoggerOptions.logPath) {
            logPath = PlatformTools.pathNormalize(
                this.fileLoggerOptions.logPath,
            )
        }
        strings = (strings as string[]).map(
            (str) => "[" + new Date().toISOString() + "]" + str,
        )
        PlatformTools.appendFileSync(
            basePath + logPath,
            strings.join("\r\n") + "\r\n",
        ) // todo: use async or implement promises?
    }

    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    protected stringifyParams(parameters: any[]) {
        try {
            return JSON.stringify(parameters)
        } catch (error) {
            // most probably circular objects in parameters
            return parameters
        }
    }
}
//#endregion
