/**
 * Audit Logger Service
 * Logs all evaluation activities, sanity checks, and score adjustments
 * for compliance, debugging, and analytics
 */

const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs', 'audit');
        this.currentLogFile = null;
        this.logBuffer = [];
        this.maxBufferSize = 100; // Flush after 100 entries
        this.initialized = false;
    }

    /**
     * Initialize the audit logger
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Create logs directory if it doesn't exist
            await fs.mkdir(this.logDir, { recursive: true });
            
            // Set current log file (daily rotation)
            const today = new Date().toISOString().split('T')[0];
            this.currentLogFile = path.join(this.logDir, `audit-${today}.jsonl`);
            
            this.initialized = true;
            console.log(`✅ Audit logger initialized: ${this.currentLogFile}`);
        } catch (error) {
            console.error('❌ Failed to initialize audit logger:', error);
            throw error;
        }
    }

    /**
     * Log an evaluation event
     */
    async logEvaluation(data) {
        await this.initialize();

        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'EVALUATION',
            sessionId: data.sessionId || 'unknown',
            userId: data.userId || 'unknown',
            question: data.question,
            answer: data.answer,
            evaluation: {
                correctness: data.evaluation.correctness,
                completeness: data.evaluation.completeness,
                depth: data.evaluation.depth,
                clarity: data.evaluation.clarity,
                score: data.evaluation.score
            },
            sanityChecks: data.sanityChecks || null,
            capsApplied: data.capsApplied || null,
            adjustments: data.adjustments || [],
            wasRejectedEarly: data.wasRejectedEarly || false,
            rejectionReason: data.rejectionReason || null,
            context: data.context || {}
        };

        await this.writeLog(logEntry);
        return logEntry;
    }

    /**
     * Log a score adjustment event
     */
    async logScoreAdjustment(data) {
        await this.initialize();

        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'SCORE_ADJUSTMENT',
            sessionId: data.sessionId || 'unknown',
            dimension: data.dimension,
            originalScore: data.originalScore,
            adjustedScore: data.adjustedScore,
            reason: data.reason,
            rule: data.rule || null
        };

        await this.writeLog(logEntry);
        return logEntry;
    }

    /**
     * Write log entry to file
     */
    async writeLog(entry) {
        try {
            // Add to buffer
            this.logBuffer.push(entry);

            // Flush if buffer is full
            if (this.logBuffer.length >= this.maxBufferSize) {
                await this.flush();
            }
        } catch (error) {
            console.error('❌ Failed to write log:', error);
        }
    }

    /**
     * Flush buffer to disk
     */
    async flush() {
        if (this.logBuffer.length === 0) return;

        try {
            const logLines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            await fs.appendFile(this.currentLogFile, logLines, 'utf8');
            this.logBuffer = [];
        } catch (error) {
            console.error('❌ Failed to flush logs:', error);
        }
    }

    /**
     * Get audit logs for a specific session
     */
    async getAuditLogs(sessionId, options = {}) {
        await this.initialize();

        try {
            const logs = [];
            const files = await fs.readdir(this.logDir);
            
            // Sort files by date (newest first)
            files.sort().reverse();

            // Limit to recent files if specified
            const filesToRead = options.days ? files.slice(0, options.days) : files;

            for (const file of filesToRead) {
                if (!file.endsWith('.jsonl')) continue;

                const filePath = path.join(this.logDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const entry = JSON.parse(line);
                        if (!sessionId || entry.sessionId === sessionId) {
                            logs.push(entry);
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }

            return logs;
        } catch (error) {
            console.error('❌ Failed to read audit logs:', error);
            return [];
        }
    }

    /**
     * Generate audit report
     */
    async generateAuditReport(options = {}) {
        await this.initialize();

        const logs = await this.getAuditLogs(null, options);

        const report = {
            totalEvaluations: 0,
            earlyRejections: 0,
            scoreAdjustments: 0,
            averageScore: 0,
            dimensionStats: {
                correctness: { total: 0, adjusted: 0 },
                completeness: { total: 0, adjusted: 0 },
                depth: { total: 0, adjusted: 0 },
                clarity: { total: 0, adjusted: 0 }
            },
            sanityCheckStats: {
                lengthIssues: 0,
                keywordIssues: 0,
                technicalIssues: 0,
                coherenceIssues: 0,
                gibberishDetected: 0
            },
            adjustmentReasons: {}
        };

        let totalScore = 0;

        for (const log of logs) {
            if (log.type === 'EVALUATION') {
                report.totalEvaluations++;
                totalScore += log.evaluation.score;

                if (log.wasRejectedEarly) {
                    report.earlyRejections++;
                }

                if (log.adjustments && log.adjustments.length > 0) {
                    report.scoreAdjustments++;
                }

                // Analyze sanity checks
                if (log.sanityChecks) {
                    if (log.sanityChecks.length && !log.sanityChecks.length.passed) {
                        report.sanityCheckStats.lengthIssues++;
                    }
                    if (log.sanityChecks.keywords && !log.sanityChecks.keywords.passed) {
                        report.sanityCheckStats.keywordIssues++;
                    }
                    if (log.sanityChecks.technical && !log.sanityChecks.technical.passed) {
                        report.sanityCheckStats.technicalIssues++;
                    }
                    if (log.sanityChecks.coherence && !log.sanityChecks.coherence.passed) {
                        report.sanityCheckStats.coherenceIssues++;
                    }
                    if (log.sanityChecks.gibberish && !log.sanityChecks.gibberish.passed) {
                        report.sanityCheckStats.gibberishDetected++;
                    }
                }

                // Track adjustment reasons
                if (log.adjustments) {
                    log.adjustments.forEach(adj => {
                        report.adjustmentReasons[adj] = (report.adjustmentReasons[adj] || 0) + 1;
                    });
                }
            }

            if (log.type === 'SCORE_ADJUSTMENT') {
                const dim = log.dimension;
                if (report.dimensionStats[dim]) {
                    report.dimensionStats[dim].adjusted++;
                }
            }
        }

        report.averageScore = report.totalEvaluations > 0 
            ? (totalScore / report.totalEvaluations).toFixed(2) 
            : 0;

        report.adjustmentRate = report.totalEvaluations > 0
            ? ((report.scoreAdjustments / report.totalEvaluations) * 100).toFixed(1) + '%'
            : '0%';

        report.rejectionRate = report.totalEvaluations > 0
            ? ((report.earlyRejections / report.totalEvaluations) * 100).toFixed(1) + '%'
            : '0%';

        return report;
    }

    /**
     * Clean up old logs
     */
    async cleanupOldLogs(daysToKeep = 30) {
        await this.initialize();

        try {
            const files = await fs.readdir(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            for (const file of files) {
                if (!file.endsWith('.jsonl')) continue;

                const match = file.match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
                if (match) {
                    const fileDate = new Date(match[1]);
                    if (fileDate < cutoffDate) {
                        const filePath = path.join(this.logDir, file);
                        await fs.unlink(filePath);
                        console.log(`🗑️  Deleted old audit log: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to cleanup old logs:', error);
        }
    }

    /**
     * Ensure logs are flushed before exit
     */
    async shutdown() {
        await this.flush();
        console.log('✅ Audit logger shutdown complete');
    }
}

module.exports = new AuditLogger();