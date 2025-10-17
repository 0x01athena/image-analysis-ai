import { ProductImages } from './ProductService';

export interface ProcessingStatus {
    isProcessing: boolean;
    currentProduct: string | null;
    totalProducts: number;
    processedProducts: number;
    failedProducts: number;
    startTime: Date | null;
    estimatedCompletion: Date | null;
    rankDistribution: {
        A: number;
        B: number;
        C: number;
    };
    uploadStatus: {
        isUploading: boolean;
        totalFiles: number;
        uploadedFiles: number;
        skippedFiles: number;
        uploadProgress: number;
    };
}

export interface ProcessingResult {
    productId: string;
    images: string[];
    title: string;
    candidateTitles?: string[];
    category: string;
    rank: 'A' | 'B' | 'C';
    measurements?: string;
    condition?: string;
    processingTime: number;
    error?: string;
}

export interface ProcessingSession {
    sessionId: string;
    productImages: ProductImages;
    processingStatus: ProcessingStatus;
    processingResults: ProcessingResult[];
    createdAt: Date;
}

export class ProcessingStateService {
    private sessions: Map<string, ProcessingSession> = new Map();
    private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Create a new processing session
     */
    createSession(productImages: ProductImages): string {
        const sessionId = this.generateSessionId();

        const session: ProcessingSession = {
            sessionId,
            productImages,
            processingStatus: {
                isProcessing: false,
                currentProduct: null,
                totalProducts: Object.keys(productImages).length,
                processedProducts: 0,
                failedProducts: 0,
                startTime: null,
                estimatedCompletion: null,
                rankDistribution: {
                    A: 0,
                    B: 0,
                    C: 0
                },
                uploadStatus: {
                    isUploading: false,
                    totalFiles: 0,
                    uploadedFiles: 0,
                    skippedFiles: 0,
                    uploadProgress: 0
                }
            },
            processingResults: [],
            createdAt: new Date()
        };

        this.sessions.set(sessionId, session);
        this.cleanupExpiredSessions();

        return sessionId;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): ProcessingSession | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Check if session is expired
        if (Date.now() - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session;
    }

    /**
     * Update processing status for a session
     */
    updateProcessingStatus(sessionId: string, status: Partial<ProcessingStatus>): boolean {
        const session = this.getSession(sessionId);
        if (!session) return false;

        session.processingStatus = { ...session.processingStatus, ...status };
        return true;
    }

    /**
     * Update upload status for a session
     */
    updateUploadStatus(sessionId: string, uploadStatus: Partial<ProcessingStatus['uploadStatus']>): boolean {
        const session = this.getSession(sessionId);
        if (!session) return false;

        session.processingStatus.uploadStatus = { ...session.processingStatus.uploadStatus, ...uploadStatus };
        return true;
    }

    /**
     * Add processing result to session
     */
    addProcessingResult(sessionId: string, result: ProcessingResult): boolean {
        const session = this.getSession(sessionId);
        if (!session) return false;

        session.processingResults.push(result);

        // Update rank distribution
        this.updateRankDistribution(sessionId);

        return true;
    }

    /**
     * Update rank distribution based on processing results
     */
    private updateRankDistribution(sessionId: string): void {
        const session = this.getSession(sessionId);
        if (!session) return;

        const distribution = { A: 0, B: 0, C: 0 };

        session.processingResults.forEach(result => {
            if (result.rank === 'A') distribution.A++;
            else if (result.rank === 'B') distribution.B++;
            else if (result.rank === 'C') distribution.C++;
        });

        session.processingStatus.rankDistribution = distribution;
    }

    /**
     * Get processing results for a session
     */
    getProcessingResults(sessionId: string): ProcessingResult[] | null {
        const session = this.getSession(sessionId);
        return session ? session.processingResults : null;
    }

    /**
     * Get processing status for a session
     */
    getProcessingStatus(sessionId: string): ProcessingStatus | null {
        const session = this.getSession(sessionId);
        return session ? session.processingStatus : null;
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    /**
     * Get all active sessions (for debugging/admin purposes)
     */
    getAllSessions(): ProcessingSession[] {
        this.cleanupExpiredSessions();
        return Array.from(this.sessions.values());
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions(): void {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
                this.sessions.delete(sessionId);
            }
        }
    }

    /**
     * Clean up completed sessions (sessions that are no longer processing)
     */
    cleanupCompletedSessions(): number {
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (!session.processingStatus.isProcessing) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
}

export const processingStateService = new ProcessingStateService();
