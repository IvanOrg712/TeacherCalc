/**
 * Statistics Utility Functions for Grade Analysis
 */

export interface GradeStats {
    count: number;
    sum: number;
    average: number;
    median: number;
    mode: number[];
    min: number;
    max: number;
    stdDeviation: number;
    passCount: number;
    failCount: number;
    passRate: number;
    passingGrade: number; // The threshold used for pass/fail calculation
}

/**
 * Calculate the average (mean) of an array of numbers
 */
export const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
};

/**
 * Calculate the median of an array of numbers
 */
export const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

/**
 * Calculate the mode(s) of an array of numbers
 * Returns array of most frequent values (can be multiple if tied)
 */
export const calculateMode = (values: number[]): number[] => {
    if (values.length === 0) return [];

    const frequency: Record<number, number> = {};
    let maxFreq = 0;

    values.forEach(val => {
        // Round to 1 decimal for grouping
        const key = Math.round(val * 10) / 10;
        frequency[key] = (frequency[key] || 0) + 1;
        if (frequency[key] > maxFreq) {
            maxFreq = frequency[key];
        }
    });

    // If all values appear once, return empty (no mode)
    if (maxFreq === 1) return [];

    return Object.entries(frequency)
        .filter(([, freq]) => freq === maxFreq)
        .map(([val]) => parseFloat(val));
};

/**
 * Calculate the standard deviation of an array of numbers
 */
export const calculateStdDeviation = (values: number[]): number => {
    if (values.length === 0) return 0;

    const avg = calculateAverage(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);

    return Math.sqrt(avgSquareDiff);
};

/**
 * Count passing grades (>= passingGrade threshold)
 * @param values - Array of grade values
 * @param passingGrade - Minimum grade to pass (default: 6)
 */
export const countPassing = (values: number[], passingGrade: number = 6): number => {
    return values.filter(val => val >= passingGrade).length;
};

/**
 * Count failing grades (< passingGrade threshold)
 * @param values - Array of grade values
 * @param passingGrade - Minimum grade to pass (default: 6)
 */
export const countFailing = (values: number[], passingGrade: number = 6): number => {
    return values.filter(val => val < passingGrade).length;
};

/**
 * Calculate all statistics for an array of grade values
 * @param values - Array of grade values
 * @param passingGrade - Minimum grade to pass (default: 6)
 */
export const calculateAllStats = (values: number[], passingGrade: number = 6): GradeStats => {
    if (values.length === 0) {
        return {
            count: 0,
            sum: 0,
            average: 0,
            median: 0,
            mode: [],
            min: 0,
            max: 0,
            stdDeviation: 0,
            passCount: 0,
            failCount: 0,
            passRate: 0,
            passingGrade
        };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const passCount = countPassing(values, passingGrade);
    const failCount = countFailing(values, passingGrade);

    return {
        count: values.length,
        sum: Math.round(sum * 100) / 100,
        average: Math.round(calculateAverage(values) * 100) / 100,
        median: Math.round(calculateMedian(values) * 100) / 100,
        mode: calculateMode(values),
        min: Math.min(...values),
        max: Math.max(...values),
        stdDeviation: Math.round(calculateStdDeviation(values) * 100) / 100,
        passCount,
        failCount,
        passRate: Math.round((passCount / values.length) * 100),
        passingGrade
    };
};
