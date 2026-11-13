// EarthTrend Explorer - Statistical Analysis Module
// Pure JavaScript implementation of trend analysis methods
// No external dependencies required

const EarthStats = (() => {

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    /**
     * Sign function: returns -1, 0, or 1
     * @param {number} x
     * @returns {number}
     */
    function sgn(x) {
        if (x > 0) return 1;
        if (x < 0) return -1;
        return 0;
    }

    /**
     * Arithmetic mean of an array of numbers.
     * @param {number[]} arr
     * @returns {number}
     */
    function mean(arr) {
        if (!arr || arr.length === 0) return NaN;
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum / arr.length;
    }

    /**
     * Median of an array of numbers (non-destructive).
     * @param {number[]} arr
     * @returns {number}
     */
    function median(arr) {
        if (!arr || arr.length === 0) return NaN;
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * Sample standard deviation.
     * Uses Bessel's correction (divides by n-1).
     * @param {number[]} arr
     * @returns {number}
     */
    function stdDev(arr) {
        if (!arr || arr.length < 2) return NaN;
        const m = mean(arr);
        let sumSq = 0;
        for (let i = 0; i < arr.length; i++) {
            const d = arr[i] - m;
            sumSq += d * d;
        }
        return Math.sqrt(sumSq / (arr.length - 1));
    }

    /**
     * Normal CDF approximation using Abramowitz & Stegun formula 26.2.17.
     * Maximum absolute error: 7.5e-8
     * @param {number} z - standard normal variate
     * @returns {number} cumulative probability P(Z <= z)
     */
    function normalCDF(z) {
        // Handle extreme values
        if (z < -8) return 0;
        if (z > 8) return 1;

        // For negative z, use symmetry: Φ(-z) = 1 - Φ(z)
        if (z < 0) return 1 - normalCDF(-z);

        // Abramowitz & Stegun constants for approximation 26.2.17
        const p  = 0.2316419;
        const b1 = 0.319381530;
        const b2 = -0.356563782;
        const b3 = 1.781477937;
        const b4 = -1.821255978;
        const b5 = 1.330274429;

        const t = 1.0 / (1.0 + p * z);
        const t2 = t * t;
        const t3 = t2 * t;
        const t4 = t3 * t;
        const t5 = t4 * t;

        const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2.0 * Math.PI);
        const cdf = 1.0 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5);

        return cdf;
    }

    /**
     * Natural logarithm of the Gamma function using Lanczos approximation.
     * @param {number} z
     * @returns {number}
     */
    function lnGamma(z) {
        // Lanczos approximation coefficients (g=7, n=9)
        const coeff = [
            0.99999999999980993,
            676.5203681218851,
            -1259.1392167224028,
            771.32342877765313,
            -176.61502916214059,
            12.507343278686905,
            -0.13857109526572012,
            9.9843695780195716e-6,
            1.5056327351493116e-7
        ];

        if (z < 0.5) {
            // Reflection formula: Γ(z) Γ(1-z) = π / sin(πz)
            return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
        }

        z -= 1;
        let x = coeff[0];
        for (let i = 1; i < coeff.length; i++) {
            x += coeff[i] / (z + i);
        }
        const t = z + 7.5; // g + 0.5
        return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    }

    /**
     * Regularized incomplete beta function I_x(a, b) using continued fraction
     * expansion (Lentz's algorithm).
     *
     * This is needed for computing the t-distribution CDF.
     *
     * @param {number} x - value in [0, 1]
     * @param {number} a - first shape parameter (> 0)
     * @param {number} b - second shape parameter (> 0)
     * @returns {number} I_x(a, b)
     */
    function betaIncomplete(x, a, b) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;

        // Use symmetry relation when x > (a+1)/(a+b+2) for faster convergence
        if (x > (a + 1) / (a + b + 2)) {
            return 1.0 - betaIncomplete(1.0 - x, b, a);
        }

        // Compute the log of the prefactor: x^a * (1-x)^b / (a * B(a,b))
        const lnPrefactor = a * Math.log(x) + b * Math.log(1 - x)
            - Math.log(a) - (lnGamma(a) + lnGamma(b) - lnGamma(a + b));
        const prefactor = Math.exp(lnPrefactor);

        // Continued fraction using Lentz's modified algorithm
        const maxIter = 200;
        const epsilon = 1e-14;
        const tiny = 1e-30;

        // f = 1 + d1/(1 + d2/(1 + ...))
        // Using the standard continued fraction for I_x(a,b)
        let f = 1.0;
        let c = 1.0;
        let d = 1.0 - (a + b) * x / (a + 1);
        if (Math.abs(d) < tiny) d = tiny;
        d = 1.0 / d;
        f = d;

        for (let m = 1; m <= maxIter; m++) {
            // Even step: numerator coefficient
            let numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));

            d = 1.0 + numerator * d;
            if (Math.abs(d) < tiny) d = tiny;
            d = 1.0 / d;

            c = 1.0 + numerator / c;
            if (Math.abs(c) < tiny) c = tiny;

            f *= d * c;

            // Odd step: numerator coefficient
            numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));

            d = 1.0 + numerator * d;
            if (Math.abs(d) < tiny) d = tiny;
            d = 1.0 / d;

            c = 1.0 + numerator / c;
            if (Math.abs(c) < tiny) c = tiny;

            const delta = d * c;
            f *= delta;

            if (Math.abs(delta - 1.0) < epsilon) break;
        }

        return prefactor * f;
    }

    /**
     * Cumulative distribution function of the Student's t-distribution.
     * Uses the regularized incomplete beta function.
     *
     * @param {number} t - t statistic
     * @param {number} df - degrees of freedom
     * @returns {number} P(T <= t)
     */
    function tCDF(t, df) {
        if (df <= 0) return NaN;

        // For large df the t-distribution approaches normal
        if (df > 1000) {
            return normalCDF(t);
        }

        // Convert to regularized incomplete beta form
        // P(T <= t) = 1 - 0.5 * I_{df/(df+t²)}(df/2, 1/2)  when t >= 0
        const x = df / (df + t * t);
        const ibeta = betaIncomplete(x, df / 2, 0.5);

        if (t >= 0) {
            return 1.0 - 0.5 * ibeta;
        } else {
            return 0.5 * ibeta;
        }
    }

    /**
     * Critical value from the t-distribution for a two-tailed test.
     * Uses a simple bisection search since we have the CDF.
     * @param {number} alpha - significance level (e.g. 0.05)
     * @param {number} df - degrees of freedom
     * @returns {number} t-critical such that P(|T| > t_crit) = alpha
     */
    function tCritical(alpha, df) {
        // We want t such that tCDF(t, df) = 1 - alpha/2
        const target = 1.0 - alpha / 2.0;
        let lo = 0;
        let hi = 10;

        // Expand upper bound if necessary
        while (tCDF(hi, df) < target) {
            hi *= 2;
        }

        // Bisection search
        for (let i = 0; i < 100; i++) {
            const mid = (lo + hi) / 2;
            if (tCDF(mid, df) < target) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return (lo + hi) / 2;
    }

    // ============================================================
    // LINEAR REGRESSION
    // ============================================================

    /**
     * Ordinary Least Squares (OLS) linear regression.
     *
     * Fits y = slope * x + intercept.
     *
     * @param {number[]} x - independent variable values (e.g., time indices)
     * @param {number[]} y - dependent variable values
     * @returns {object} Regression results:
     *   - slope {number}
     *   - intercept {number}
     *   - rSquared {number} - coefficient of determination
     *   - standardError {number} - standard error of the slope
     *   - tStatistic {number}
     *   - pValue {number} - two-tailed p-value for slope ≠ 0
     *   - slopeCI {object} - { lower, upper } 95% confidence interval for slope
     *   - residuals {number[]}
     *   - predicted {number[]}
     */
    function linearRegression(x, y) {
        const n = x.length;
        if (n < 3) {
            return {
                slope: NaN, intercept: NaN, rSquared: NaN,
                standardError: NaN, tStatistic: NaN, pValue: NaN,
                slopeCI: { lower: NaN, upper: NaN },
                residuals: [], predicted: []
            };
        }

        const xMean = mean(x);
        const yMean = mean(y);

        // Slope = Σ((xi - x̄)(yi - ȳ)) / Σ((xi - x̄)²)
        let ssXY = 0; // sum of products of deviations
        let ssXX = 0; // sum of squared deviations of x
        for (let i = 0; i < n; i++) {
            const dx = x[i] - xMean;
            const dy = y[i] - yMean;
            ssXY += dx * dy;
            ssXX += dx * dx;
        }

        const slope = ssXY / ssXX;
        const intercept = yMean - slope * xMean;

        // Predicted values and residuals
        const predicted = new Array(n);
        const residuals = new Array(n);
        let ssRes = 0; // residual sum of squares
        let ssTot = 0; // total sum of squares
        for (let i = 0; i < n; i++) {
            predicted[i] = slope * x[i] + intercept;
            residuals[i] = y[i] - predicted[i];
            ssRes += residuals[i] * residuals[i];
            const dy = y[i] - yMean;
            ssTot += dy * dy;
        }

        // R² = 1 - SS_res / SS_tot
        const rSquared = (ssTot === 0) ? NaN : 1 - ssRes / ssTot;

        // Degrees of freedom
        const df = n - 2;

        // Mean squared error (residual variance)
        const mse = ssRes / df;

        // Standard error of the slope = sqrt(MSE / SS_XX)
        const standardError = Math.sqrt(mse / ssXX);

        // t-statistic = slope / SE(slope)
        const tStatistic = (standardError === 0) ? Infinity : slope / standardError;

        // Two-tailed p-value from t-distribution with df = n-2
        const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

        // 95% confidence interval for slope
        const tCrit = tCritical(0.05, df);
        const slopeCI = {
            lower: slope - tCrit * standardError,
            upper: slope + tCrit * standardError
        };

        return {
            slope,
            intercept,
            rSquared,
            standardError,
            tStatistic,
            pValue,
            slopeCI,
            residuals,
            predicted
        };
    }

    // ============================================================
    // MANN-KENDALL TREND TEST
    // ============================================================

    /**
     * Non-parametric Mann-Kendall trend test.
     *
     * Tests for a monotonic trend in time-series data without assuming
     * any particular distribution of the data.
     *
     * @param {number[]} data - values in chronological order
     * @returns {object} Test results:
     *   - S {number} - the Mann-Kendall statistic
     *   - variance {number} - Var(S)
     *   - Z {number} - standardized test statistic
     *   - pValue {number} - two-tailed p-value
     *   - tau {number} - Kendall's tau (-1 to +1)
     *   - trend {string} - "increasing", "decreasing", or "no trend"
     *   - significant {boolean} - true if p < 0.05
     */
    function mannKendall(data) {
        const n = data.length;
        if (n < 4) {
            return {
                S: 0, variance: 0, Z: 0, pValue: 1,
                tau: 0, trend: 'no trend', significant: false
            };
        }

        // 1. Calculate S = Σ Σ sgn(xj - xi) for all j > i
        let S = 0;
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                S += sgn(data[j] - data[i]);
            }
        }

        // 2. Count tied groups
        // Sort a copy to find groups of equal values
        const sorted = data.slice().sort((a, b) => a - b);
        const tiedGroups = []; // array of group sizes > 1
        let i = 0;
        while (i < n) {
            let count = 1;
            while (i + count < n && sorted[i + count] === sorted[i]) {
                count++;
            }
            if (count > 1) {
                tiedGroups.push(count);
            }
            i += count;
        }

        // 3. Variance of S with tie correction
        // Var(S) = [n(n-1)(2n+5) - Σ tp(tp-1)(2tp+5)] / 18
        let varianceNumerator = n * (n - 1) * (2 * n + 5);
        for (let g = 0; g < tiedGroups.length; g++) {
            const tp = tiedGroups[g];
            varianceNumerator -= tp * (tp - 1) * (2 * tp + 5);
        }
        const variance = varianceNumerator / 18;

        // 4. Standardized test statistic Z with continuity correction
        let Z;
        if (S > 0) {
            Z = (S - 1) / Math.sqrt(variance);
        } else if (S < 0) {
            Z = (S + 1) / Math.sqrt(variance);
        } else {
            Z = 0;
        }

        // 5. Two-tailed p-value
        const pValue = 2 * (1 - normalCDF(Math.abs(Z)));

        // 6. Kendall's tau = S / (n*(n-1)/2)
        const tau = (2 * S) / (n * (n - 1));

        // 7. Determine trend direction
        let trend;
        if (S > 0) {
            trend = 'increasing';
        } else if (S < 0) {
            trend = 'decreasing';
        } else {
            trend = 'no trend';
        }

        // 8. Statistical significance at α = 0.05
        const significant = pValue < 0.05;

        return { S, variance, Z, pValue, tau, trend, significant };
    }

    // ============================================================
    // SEN'S SLOPE ESTIMATOR
    // ============================================================

    /**
     * Theil-Sen's slope estimator (median of all pairwise slopes).
     *
     * A robust, non-parametric estimate of the rate of change that is
     * resistant to up to 29% outliers.
     *
     * @param {number[]} x - time indices (numeric)
     * @param {number[]} y - data values
     * @returns {object} Results:
     *   - slope {number} - the Sen's slope estimate
     *   - intercept {number} - the corresponding intercept
     *   - confidenceInterval {object} - { lower, upper } at 95%
     */
    function sensSlope(x, y) {
        const n = x.length;
        if (n < 3) {
            return {
                slope: NaN,
                intercept: NaN,
                confidenceInterval: { lower: NaN, upper: NaN }
            };
        }

        // 1. Calculate all pairwise slopes: (yj - yi) / (xj - xi) for j > i
        const slopes = [];
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                if (x[j] !== x[i]) {
                    slopes.push((y[j] - y[i]) / (x[j] - x[i]));
                }
            }
        }

        // 2. Sort slopes and take the median → Sen's slope
        slopes.sort((a, b) => a - b);
        const slopeEstimate = median(slopes);

        // 3. Intercept = median(yi - slope * xi)
        const intercepts = new Array(n);
        for (let i = 0; i < n; i++) {
            intercepts[i] = y[i] - slopeEstimate * x[i];
        }
        const interceptEstimate = median(intercepts);

        // 4. 95% confidence interval for the slope
        //    Uses the variance from the Mann-Kendall test:
        //    C_alpha = z_{1 - α/2} * sqrt(Var(S))
        //    Lower rank index = floor((N - C_alpha) / 2)
        //    Upper rank index = ceil((N + C_alpha) / 2)

        // Compute Var(S) (same as Mann-Kendall)
        const sorted = y.slice().sort((a, b) => a - b);
        const tiedGroups = [];
        let idx = 0;
        while (idx < n) {
            let count = 1;
            while (idx + count < n && sorted[idx + count] === sorted[idx]) {
                count++;
            }
            if (count > 1) {
                tiedGroups.push(count);
            }
            idx += count;
        }

        let varianceNumerator = n * (n - 1) * (2 * n + 5);
        for (let g = 0; g < tiedGroups.length; g++) {
            const tp = tiedGroups[g];
            varianceNumerator -= tp * (tp - 1) * (2 * tp + 5);
        }
        const varianceS = varianceNumerator / 18;

        const N = slopes.length;
        const zAlpha = 1.96; // z_{0.975} for 95% CI
        const cAlpha = zAlpha * Math.sqrt(varianceS);

        let lowerRank = Math.round((N - cAlpha) / 2);
        let upperRank = Math.round((N + cAlpha) / 2);

        // Clamp ranks to valid indices
        lowerRank = Math.max(0, Math.min(N - 1, lowerRank));
        upperRank = Math.max(0, Math.min(N - 1, upperRank));

        const ciLower = slopes[lowerRank];
        const ciUpper = slopes[upperRank];

        return {
            slope: slopeEstimate,
            intercept: interceptEstimate,
            confidenceInterval: {
                lower: ciLower,
                upper: ciUpper
            }
        };
    }

    // ============================================================
    // SEASONAL DECOMPOSITION (Simple Moving Average approach)
    // ============================================================

    /**
     * Additive seasonal decomposition using centered moving averages.
     *
     * Decomposes a time series into: data = trend + seasonal + residual
     *
     * @param {number[]} data - the time series values
     * @param {number} period - seasonal period (e.g. 12 for monthly data)
     * @returns {object} Components:
     *   - trend {(number|null)[]} - trend component (null at edges)
     *   - seasonal {number[]} - seasonal component
     *   - residual {(number|null)[]} - residual/irregular component
     *   - deseasonalized {number[]} - data with seasonal component removed
     */
    function seasonalDecompose(data, period) {
        const n = data.length;

        // 1. Calculate centered moving average (trend component)
        //    For even periods (like 12), use a 2×period moving average
        //    i.e. first take a period-length MA, then a 2-length MA of that
        const trend = new Array(n).fill(null);

        if (period % 2 === 0) {
            // Even period: two-step centered moving average
            // Step 1: simple moving average of length = period
            const halfP = period / 2;
            const ma1 = new Array(n).fill(null);
            for (let i = halfP; i <= n - halfP; i++) {
                let sum = 0;
                // Average from i - halfP to i + halfP - 1  (period values)
                for (let j = i - halfP; j < i + halfP; j++) {
                    sum += data[j];
                }
                ma1[i] = sum / period;
            }

            // Step 2: 2-point moving average to center it
            for (let i = halfP; i < n - halfP; i++) {
                if (ma1[i] !== null && ma1[i + 1] !== null) {
                    trend[i] = (ma1[i] + ma1[i + 1]) / 2;
                }
            }
        } else {
            // Odd period: single centered moving average
            const halfP = Math.floor(period / 2);
            for (let i = halfP; i < n - halfP; i++) {
                let sum = 0;
                for (let j = i - halfP; j <= i + halfP; j++) {
                    sum += data[j];
                }
                trend[i] = sum / period;
            }
        }

        // 2. Calculate detrended series = data - trend
        const detrended = new Array(n).fill(null);
        for (let i = 0; i < n; i++) {
            if (trend[i] !== null) {
                detrended[i] = data[i] - trend[i];
            }
        }

        // 3. Average detrended values for each seasonal position
        //    to get the raw seasonal indices
        const seasonalRaw = new Array(period).fill(0);
        const seasonalCount = new Array(period).fill(0);

        for (let i = 0; i < n; i++) {
            if (detrended[i] !== null) {
                const pos = i % period;
                seasonalRaw[pos] += detrended[i];
                seasonalCount[pos]++;
            }
        }

        for (let p = 0; p < period; p++) {
            if (seasonalCount[p] > 0) {
                seasonalRaw[p] /= seasonalCount[p];
            }
        }

        // 4. Normalize seasonal component so it sums to zero
        const seasonalMean = mean(seasonalRaw);
        const seasonalIndices = seasonalRaw.map(v => v - seasonalMean);

        // Extend seasonal indices across the full series
        const seasonal = new Array(n);
        for (let i = 0; i < n; i++) {
            seasonal[i] = seasonalIndices[i % period];
        }

        // 5. Residual = data - trend - seasonal
        const residual = new Array(n).fill(null);
        for (let i = 0; i < n; i++) {
            if (trend[i] !== null) {
                residual[i] = data[i] - trend[i] - seasonal[i];
            }
        }

        // 6. Deseasonalized = data - seasonal
        const deseasonalized = new Array(n);
        for (let i = 0; i < n; i++) {
            deseasonalized[i] = data[i] - seasonal[i];
        }

        return { trend, seasonal, residual, deseasonalized };
    }

    // ============================================================
    // MOVING AVERAGE
    // ============================================================

    /**
     * Simple moving average (centered).
     *
     * Returns an array of the same length as data, with null values at
     * the edges where the window extends beyond the data.
     *
     * @param {number[]} data - input values
     * @param {number} window - window width (should be odd for symmetric centering)
     * @returns {(number|null)[]}
     */
    function movingAverage(data, window) {
        const n = data.length;
        const result = new Array(n).fill(null);

        if (window < 1 || window > n) return result;

        const halfW = Math.floor(window / 2);

        for (let i = halfW; i < n - halfW; i++) {
            let sum = 0;
            let count = 0;
            for (let j = i - halfW; j <= i + halfW; j++) {
                if (j >= 0 && j < n && data[j] !== null && !isNaN(data[j])) {
                    sum += data[j];
                    count++;
                }
            }
            if (count > 0) {
                result[i] = sum / count;
            }
        }

        return result;
    }

    // ============================================================
    // ANOMALY CALCULATION
    // ============================================================

    /**
     * Calculate anomalies from the climatological mean.
     *
     * For each position in the seasonal cycle, computes the long-term
     * mean across all cycles, then subtracts it from each data point.
     *
     * @param {number[]} data - the time series values
     * @param {number} period - the seasonal period (e.g. 12 for monthly data)
     * @returns {number[]} anomalies (deviations from climatological mean)
     */
    function calculateAnomalies(data, period) {
        const n = data.length;

        // Compute climatological mean for each position in the cycle
        const climatology = new Array(period).fill(0);
        const count = new Array(period).fill(0);

        for (let i = 0; i < n; i++) {
            const pos = i % period;
            if (data[i] !== null && !isNaN(data[i])) {
                climatology[pos] += data[i];
                count[pos]++;
            }
        }
        for (let p = 0; p < period; p++) {
            if (count[p] > 0) {
                climatology[p] /= count[p];
            }
        }

        // Anomaly = value - climatological mean at that position
        const anomalies = new Array(n);
        for (let i = 0; i < n; i++) {
            if (data[i] !== null && !isNaN(data[i])) {
                anomalies[i] = data[i] - climatology[i % period];
            } else {
                anomalies[i] = NaN;
            }
        }

        return anomalies;
    }

    // ============================================================
    // SUMMARY GENERATOR
    // ============================================================

    /**
     * Generate a plain-language HTML summary of trend analysis results.
     *
     * Produces educational, readable text suitable for high-school and
     * college students.
     *
     * @param {object} params
     *   - variableName {string} e.g. "Surface Temperature"
     *   - variableUnit {string} e.g. "°C"
     *   - regionName {string} e.g. "Amazon Basin"
     *   - regression {object} from linearRegression()
     *   - mannKendall {object} from mannKendall()
     *   - sensSlope {object} from sensSlope()
     *   - startYear {number}
     *   - endYear {number}
     * @returns {string} HTML-formatted summary
     */
    function generateSummary(params) {
        const {
            variableName = 'Variable',
            variableUnit = '',
            regionName = 'the selected region',
            regression,
            mannKendall: mk,
            sensSlope: ss,
            startYear,
            endYear,
            temporal = 'monthly'
        } = params;

        const years = endYear - startYear;
        const unit = variableUnit ? ` ${variableUnit}` : '';

        // The regression/Sen slopes are per time step (per month or per day).
        // Convert to per-year for human-readable rates.
        const divisor = temporal === 'daily' ? 365 : 12;

        // ── Significance interpretation ──
        let significanceText, significanceClass, confidenceLevel;
        const pValue = mk ? mk.pValue : (regression ? regression.pValue : 1);

        if (pValue < 0.001) {
            significanceText = 'highly significant';
            confidenceLevel = '99.9% confidence';
            significanceClass = 'sig-high';
        } else if (pValue < 0.01) {
            significanceText = 'highly significant';
            confidenceLevel = '99% confidence';
            significanceClass = 'sig-high';
        } else if (pValue < 0.05) {
            significanceText = 'statistically significant';
            confidenceLevel = '95% confidence';
            significanceClass = 'sig-medium';
        } else if (pValue < 0.10) {
            significanceText = 'marginally significant';
            confidenceLevel = '90% confidence';
            significanceClass = 'sig-low';
        } else {
            significanceText = 'not statistically significant';
            confidenceLevel = 'below 90% confidence';
            significanceClass = 'sig-none';
        }

        // ── Trend direction ──
        const trendDir = mk ? mk.trend : (regression && regression.slope > 0 ? 'increasing' : 'decreasing');
        const trendWord = trendDir === 'increasing' ? 'increasing' :
                          trendDir === 'decreasing' ? 'decreasing' : 'stable';
        const trendArrow = trendDir === 'increasing' ? '↑' :
                           trendDir === 'decreasing' ? '↓' : '→';

        // ── Rate of change ──
        // Slopes from regression/Sen are per time step; multiply by divisor for per-year.
        const rawSlope = ss ? ss.slope : (regression ? regression.slope : 0);
        const slopePerYear = rawSlope * divisor;
        const slopePerDecade = slopePerYear * 10;
        const totalChange = slopePerYear * years;
        const sign = slopePerYear >= 0 ? '+' : '';

        // ── Format numbers ──
        function fmt(v, digits) {
            if (v === null || v === undefined || isNaN(v)) return 'N/A';
            return (v >= 0 ? '+' : '') + v.toFixed(digits);
        }
        function fmtAbs(v, digits) {
            if (v === null || v === undefined || isNaN(v)) return 'N/A';
            return v.toFixed(digits);
        }
        function fmtP(p) {
            if (p === null || p === undefined || isNaN(p)) return 'N/A';
            if (p < 0.001) return '< 0.001';
            if (p < 0.01) return '< 0.01';
            if (p < 0.05) return '< 0.05';
            return p.toFixed(3);
        }

        // ── Build HTML ──
        let html = '';

        // Main finding
        html += `<div class="summary-section summary-main">`;
        html += `<h3>${trendArrow} Trend Summary</h3>`;
        html += `<p>Over the period <strong>${startYear}–${endYear}</strong> (${years} years), `;
        html += `<strong>${variableName}</strong> in <strong>${regionName}</strong> `;
        html += `shows a <span class="${significanceClass}"><strong>${significanceText} `;
        html += `${trendWord} trend</strong></span> (p ${fmtP(pValue)}, ${confidenceLevel}).</p>`;
        html += `</div>`;

        // Rate of change
        html += `<div class="summary-section summary-rate">`;
        html += `<h3>📊 Rate of Change</h3>`;
        html += `<table class="summary-table">`;
        html += `<tr><td>Per year (Sen's slope)</td><td><strong>${fmt(slopePerYear, 4)}${unit}/year</strong></td></tr>`;
        html += `<tr><td>Per decade</td><td><strong>${fmt(slopePerDecade, 3)}${unit}/decade</strong></td></tr>`;
        html += `<tr><td>Total change (${years} years)</td><td><strong>${fmt(totalChange, 3)}${unit}</strong></td></tr>`;

        if (ss && ss.confidenceInterval) {
            html += `<tr><td>95% CI for slope</td><td>${fmtAbs(ss.confidenceInterval.lower * divisor, 4)} to ${fmt(ss.confidenceInterval.upper * divisor, 4)}${unit}/year</td></tr>`;
        }
        html += `</table>`;
        html += `</div>`;

        // Statistical details
        html += `<div class="summary-section summary-stats">`;
        html += `<h3>🔬 Statistical Details</h3>`;
        html += `<table class="summary-table">`;

        if (mk) {
            html += `<tr><td>Mann-Kendall S</td><td>${mk.S}</td></tr>`;
            html += `<tr><td>Kendall's τ (tau)</td><td>${fmtAbs(mk.tau, 4)}</td></tr>`;
            html += `<tr><td>M-K Z statistic</td><td>${fmtAbs(mk.Z, 4)}</td></tr>`;
            html += `<tr><td>M-K p-value</td><td>${fmtP(mk.pValue)}</td></tr>`;
        }

        if (regression) {
            html += `<tr><td>OLS slope</td><td>${fmt(regression.slope, 4)}${unit}/year</td></tr>`;
            html += `<tr><td>R²</td><td>${fmtAbs(regression.rSquared, 4)}</td></tr>`;
            html += `<tr><td>OLS t-statistic</td><td>${fmtAbs(regression.tStatistic, 3)}</td></tr>`;
            html += `<tr><td>OLS p-value</td><td>${fmtP(regression.pValue)}</td></tr>`;
        }

        html += `</table>`;
        html += `</div>`;

        // Interpretation guide
        html += `<div class="summary-section summary-interpretation">`;
        html += `<h3>📖 What Does This Mean?</h3>`;

        if (pValue < 0.05) {
            html += `<p>The statistical tests confirm a <strong>real trend</strong> in the data — `;
            html += `it is very unlikely this pattern occurred by random chance alone. `;
            html += `In practical terms, <strong>${variableName.toLowerCase()}</strong> has `;
            html += `${trendDir === 'increasing' ? 'risen' : 'fallen'} by approximately `;
            html += `<strong>${Math.abs(totalChange).toFixed(3)}${unit}</strong> over the ${years}-year period.</p>`;

            html += `<p>The <em>Sen's slope</em> is a robust measure of the rate of change — `;
            html += `it uses the median of all possible slopes between pairs of data points, `;
            html += `making it resistant to outliers. The <em>Mann-Kendall test</em> checks `;
            html += `whether the trend is statistically real without assuming the data follows `;
            html += `a normal distribution.</p>`;
        } else if (pValue < 0.10) {
            html += `<p>There is <em>weak evidence</em> of a trend, but it does not meet the `;
            html += `conventional threshold for statistical significance (p&nbsp;&lt;&nbsp;0.05). `;
            html += `This could mean the trend is real but subtle, or that more data is needed `;
            html += `to draw a firm conclusion.</p>`;
        } else {
            html += `<p>The data does <strong>not</strong> show a statistically significant trend `;
            html += `over the ${years}-year period. This does not necessarily mean there is no `;
            html += `change at all — the variability in the data may be masking a small signal, `;
            html += `or the time period may be too short to detect a gradual change.</p>`;
        }

        // R² explanation
        if (regression && !isNaN(regression.rSquared)) {
            const rSqPercent = (regression.rSquared * 100).toFixed(1);
            html += `<p><strong>R² = ${fmtAbs(regression.rSquared, 4)}</strong> means that `;
            html += `${rSqPercent}% of the variation in the data can be explained by the `;
            html += `linear trend over time. The remaining ${(100 - parseFloat(rSqPercent)).toFixed(1)}% `;
            html += `is due to other factors such as natural variability, seasonal cycles, `;
            html += `and measurement noise.</p>`;
        }

        html += `</div>`;

        // Method notes
        html += `<div class="summary-section summary-methods">`;
        html += `<h3>📐 Methods Used</h3>`;
        html += `<ul>`;
        html += `<li><strong>Ordinary Least Squares (OLS)</strong> — fits a straight line through `;
        html += `the data minimizing the sum of squared residuals. Best when the data is roughly `;
        html += `normally distributed.</li>`;
        html += `<li><strong>Mann-Kendall Test</strong> — a non-parametric test that counts `;
        html += `whether later values tend to be larger (or smaller) than earlier values. `;
        html += `No assumptions about data distribution.</li>`;
        html += `<li><strong>Sen's Slope</strong> — the median of all pairwise slopes. `;
        html += `Robust to outliers and non-normal data — often preferred for environmental data.</li>`;
        html += `</ul>`;
        html += `</div>`;

        return html;
    }

    // ============================================================
    // DATA QUALITY
    // ============================================================

    /**
     * Check for and handle missing values commonly found in NASA Earth
     * science datasets (typically encoded as -999, -9999, or NaN).
     *
     * @param {number[]} data - raw data array
     * @param {number} [missingValue=-999] - sentinel for missing values
     * @returns {object}
     *   - cleanData {number[]} - values with missing entries removed
     *   - validIndices {number[]} - original indices of valid values
     *   - missingCount {number}
     *   - missingPercent {number}
     */
    function cleanData(data, missingValue = -999) {
        const cleanArr = [];
        const validIndices = [];
        let missingCount = 0;

        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            if (v === null || v === undefined || isNaN(v) ||
                v === missingValue || v === -9999 || v === -999.0 || v === -9999.0) {
                missingCount++;
            } else {
                cleanArr.push(v);
                validIndices.push(i);
            }
        }

        return {
            cleanData: cleanArr,
            validIndices,
            missingCount,
            missingPercent: data.length > 0
                ? (missingCount / data.length) * 100
                : 0
        };
    }

    // ============================================================
    // COMPREHENSIVE ANALYSIS
    // ============================================================

    /**
     * Run all available analyses on a dataset and return a combined
     * results object.
     *
     * @param {object} params
     *   - x {number[]} - time indices (e.g. year values or 0..n-1)
     *   - y {number[]} - data values
     *   - period {number} [optional] - seasonal period (e.g. 12 for monthly)
     *   - variableName {string}
     *   - variableUnit {string}
     *   - regionName {string}
     *   - startYear {number}
     *   - endYear {number}
     * @returns {object} Combined results with all analyses
     */
    function fullAnalysis(params) {
        const {
            x: rawX,
            y: rawY,
            period,
            variableName = 'Variable',
            variableUnit = '',
            regionName = 'Selected Region',
            startYear,
            endYear
        } = params;

        // 1. Clean data
        const cleaned = cleanData(rawY);
        const xClean = cleaned.validIndices.map(i => rawX[i]);
        const yClean = cleaned.cleanData;

        const results = {
            dataQuality: {
                originalLength: rawY.length,
                cleanLength: yClean.length,
                missingCount: cleaned.missingCount,
                missingPercent: cleaned.missingPercent
            }
        };

        // 2. Calculate anomalies if period given
        if (period && period > 0) {
            results.anomalies = calculateAnomalies(yClean, period);
        }

        // 3. Linear regression on cleaned data
        results.regression = linearRegression(xClean, yClean);

        // 4. Mann-Kendall trend test
        results.mannKendall = mannKendall(yClean);

        // 5. Sen's slope
        results.sensSlope = sensSlope(xClean, yClean);

        // 6. Moving averages (several window sizes)
        results.movingAverages = {};
        if (yClean.length >= 5) {
            results.movingAverages['5-point'] = movingAverage(yClean, 5);
        }
        if (yClean.length >= 11) {
            results.movingAverages['11-point'] = movingAverage(yClean, 11);
        }
        if (period && yClean.length >= period) {
            results.movingAverages[`${period}-point`] = movingAverage(yClean, period);
        }

        // 7. Seasonal decomposition
        if (period && period > 0 && yClean.length >= period * 2) {
            results.seasonal = seasonalDecompose(yClean, period);
        }

        // 8. Generate human-readable summary
        results.summary = generateSummary({
            variableName,
            variableUnit,
            regionName,
            regression: results.regression,
            mannKendall: results.mannKendall,
            sensSlope: results.sensSlope,
            startYear,
            endYear,
            temporal: params.temporal || 'monthly'
        });

        // Attach cleaned data for downstream use
        results.x = xClean;
        results.y = yClean;

        return results;
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    return {
        linearRegression,
        mannKendall,
        sensSlope,
        seasonalDecompose,
        movingAverage,
        calculateAnomalies,
        generateSummary,
        cleanData,
        fullAnalysis,
        // Expose helpers for testing
        mean,
        stdDev
    };

})();
