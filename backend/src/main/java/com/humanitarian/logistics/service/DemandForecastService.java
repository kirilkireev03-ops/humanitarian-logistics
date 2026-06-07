package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.ForecastResponse;
import com.humanitarian.logistics.dto.ModelComparisonDto;
import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.StockTransaction;
import com.humanitarian.logistics.model.TransactionType;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.StockTransactionRepository;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Прогноз попиту на основі місячних OUTBOUND: SES, Holt (згасаючий тренд), ковзне середнє, AUTO за ПКПМ.
 * Перед розрахунком застосовується winsorization викидів; прогноз обмежується реалістичним коридором.
 */
@Service
public class DemandForecastService {

    private static final DateTimeFormatter LABEL_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final double IQR_MULTIPLIER = 1.5;
    private static final double HOLT_DAMPING = 0.88;
    private static final double MAX_TREND_RATIO = 0.10;

    private final StockTransactionRepository transactionRepository;
    private final CargoRepository cargoRepository;

    public DemandForecastService(
            StockTransactionRepository transactionRepository, CargoRepository cargoRepository) {
        this.transactionRepository = transactionRepository;
        this.cargoRepository = cargoRepository;
    }

    @Transactional(readOnly = true)
    public ForecastResponse forecast(
            Long cargoId,
            String model,
            Double alpha,
            Double beta,
            int horizonMonths,
            int historyMonths) {
        if (cargoId == null) {
            throw new IllegalArgumentException("cargoId is required");
        }
        if (alpha != null && (alpha <= 0 || alpha > 1)) {
            throw new IllegalArgumentException("alpha must be in (0, 1]");
        }
        if (beta != null && (beta <= 0 || beta > 1)) {
            throw new IllegalArgumentException("beta must be in (0, 1]");
        }
        if (horizonMonths < 1 || horizonMonths > 36) {
            throw new IllegalArgumentException("horizon must be 1..36");
        }
        if (historyMonths < 3 || historyMonths > 120) {
            throw new IllegalArgumentException("historyMonths must be 3..120");
        }
        Model selectedModel = parseModel(model);
        Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();

        Instant now = Instant.now();
        Instant from = now.minus(historyMonths * 30L, ChronoUnit.DAYS);

        List<StockTransaction> txs =
                transactionRepository.findDemandInRange(cargoId, TransactionType.OUTBOUND, from, now);

        Map<String, Double> monthly = new LinkedHashMap<>();
        for (StockTransaction t : txs) {
            ZonedDateTime z = t.getOccurredAt().atZone(ZoneOffset.UTC);
            String key = z.getYear() + "-" + String.format("%02d", z.getMonthValue());
            monthly.merge(key, (double) t.getQuantity(), Double::sum);
        }

        List<String> periodLabels = monthly.keySet().stream().sorted().toList();
        List<Double> demandRaw = periodLabels.stream().map(monthly::get).toList();

        if (demandRaw.isEmpty()) {
            throw new IllegalArgumentException(
                    "Insufficient history: no OUTBOUND data for cargoId="
                            + cargoId
                            + ". Increase historyMonths or record outbound transactions.");
        }
        if (demandRaw.size() < 3) {
            throw new IllegalArgumentException(
                    "Insufficient history for forecasting cargoId="
                            + cargoId
                            + ": need >= 3 monthly points, got "
                            + demandRaw.size()
                            + ". Increase historyMonths or record more outbound transactions.");
        }

        Preprocessed pre = preprocess(demandRaw);
        ForecastComputation comp =
                computeForecast(selectedModel, pre.cleaned(), alpha, beta, horizonMonths, pre.floor(), pre.ceiling());

        List<String> warnings = new ArrayList<>();
        if (pre.outlierCount() > 0) {
            warnings.add(
                    "Виявлено "
                            + pre.outlierCount()
                            + " місяць(і) з аномально високим/низьким відпуском; для моделі застосовано winsorization (обмеження викидів за правилом 1.5×IQR).");
        }
        if (comp.cappedSteps() > 0) {
            warnings.add(
                    "Прогноз "
                            + comp.cappedSteps()
                            + " період(ів) обмежено системним коридором ["
                            + formatNum(pre.floor())
                            + " … "
                            + formatNum(pre.ceiling())
                            + "] для фізично реалістичного результату.");
        }

        List<String> forecastLabels = new ArrayList<>();
        ZonedDateTime lastPeriod = parseLastPeriod(periodLabels.get(periodLabels.size() - 1));
        for (int h = 1; h <= horizonMonths; h++) {
            forecastLabels.add(LABEL_FMT.format(lastPeriod.plusMonths(h)));
        }

        String stabilityNote =
                "Моделі SES/Холт/КС підбирають параметри за мінімумом ПКПМ на очищеній історії. "
                        + "Тренд Холта згасає (φ="
                        + HOLT_DAMPING
                        + "); прогноз не виходить за коридор, обчислений з медіани та 90-го перцентиля відпуску. "
                        + "Різкі піки на графіку факту часто означають разові сплески відпуску, а не стійкий тренд.";

        List<ModelComparisonDto> modelComparisons =
                List.of(
                        toComparison(computeForecast(Model.SES, pre.cleaned(), alpha, beta, horizonMonths, pre.floor(), pre.ceiling())),
                        toComparison(computeForecast(Model.HOLT, pre.cleaned(), alpha, beta, horizonMonths, pre.floor(), pre.ceiling())),
                        toComparison(computeForecast(Model.MA, pre.cleaned(), alpha, beta, horizonMonths, pre.floor(), pre.ceiling())));

        return new ForecastResponse(
                cargo.getId(),
                cargo.getName(),
                comp.model(),
                comp.alpha(),
                comp.beta(),
                comp.mse(),
                comp.mae(),
                modelComparisons,
                periodLabels,
                demandRaw,
                pre.cleaned(),
                pre.outlierFlags(),
                comp.fitted(),
                forecastLabels,
                comp.forecast(),
                pre.floor(),
                pre.ceiling(),
                warnings,
                stabilityNote);
    }

    private static ModelComparisonDto toComparison(ForecastComputation c) {
        return new ModelComparisonDto(c.model(), c.mse(), c.mae());
    }

    private static String formatNum(double v) {
        return String.format(Locale.ROOT, "%.0f", v);
    }

    private ZonedDateTime parseLastPeriod(String ym) {
        String[] p = ym.split("-");
        int y = Integer.parseInt(p[0]);
        int m = Integer.parseInt(p[1]);
        return ZonedDateTime.of(y, m, 1, 0, 0, 0, 0, ZoneOffset.UTC);
    }

    private Preprocessed preprocess(List<Double> raw) {
        List<Double> sorted = new ArrayList<>(raw);
        Collections.sort(sorted);
        double q1 = percentile(sorted, 25);
        double q3 = percentile(sorted, 75);
        double iqr = Math.max(0.0, q3 - q1);
        double upperFence = q3 + IQR_MULTIPLIER * iqr;
        double lowerFence = Math.max(0.0, q1 - IQR_MULTIPLIER * iqr);

        List<Double> cleaned = new ArrayList<>(raw.size());
        List<Boolean> outlierFlags = new ArrayList<>(raw.size());
        int outlierCount = 0;
        for (double v : raw) {
            boolean outlier = v > upperFence || v < lowerFence;
            outlierFlags.add(outlier);
            if (outlier) {
                outlierCount++;
            }
            double adjusted = v;
            if (v > upperFence) {
                adjusted = upperFence;
            } else if (v < lowerFence) {
                adjusted = lowerFence;
            }
            cleaned.add(adjusted);
        }

        List<Double> sortedCleaned = new ArrayList<>(cleaned);
        Collections.sort(sortedCleaned);
        double median = percentile(sortedCleaned, 50);
        double p90 = percentile(sortedCleaned, 90);
        double p10 = percentile(sortedCleaned, 10);
        double avg = cleaned.stream().mapToDouble(x -> x).average().orElse(median);

        double floor = Math.max(0.0, Math.min(p10 * 0.85, median * 0.45));
        double ceiling =
                Math.max(
                        median * 1.35,
                        Math.max(p90 * 1.20, avg * 1.45));
        if (ceiling < floor + 1.0) {
            ceiling = floor + Math.max(10.0, median * 0.5);
        }

        return new Preprocessed(raw, cleaned, outlierFlags, outlierCount, floor, ceiling);
    }

    private static double percentile(List<Double> sortedAsc, int p) {
        if (sortedAsc.isEmpty()) {
            return 0.0;
        }
        if (sortedAsc.size() == 1) {
            return sortedAsc.get(0);
        }
        double rank = (p / 100.0) * (sortedAsc.size() - 1);
        int lo = (int) Math.floor(rank);
        int hi = (int) Math.ceil(rank);
        if (lo == hi) {
            return sortedAsc.get(lo);
        }
        double w = rank - lo;
        return sortedAsc.get(lo) * (1 - w) + sortedAsc.get(hi) * w;
    }

    private ForecastComputation computeForecast(
            Model model,
            List<Double> series,
            Double alpha,
            Double beta,
            int horizonMonths,
            double floor,
            double ceiling) {
        if (model == Model.SES) {
            return ses(series, alpha, horizonMonths, floor, ceiling);
        }
        if (model == Model.HOLT) {
            return holt(series, alpha, beta, horizonMonths, floor, ceiling);
        }
        if (model == Model.MA) {
            return movingAverage(series, horizonMonths, floor, ceiling);
        }
        ForecastComputation ses = ses(series, alpha, horizonMonths, floor, ceiling);
        ForecastComputation holt = holt(series, alpha, beta, horizonMonths, floor, ceiling);
        ForecastComputation ma = movingAverage(series, horizonMonths, floor, ceiling);
        return Arrays.asList(ses, holt, ma).stream()
                .min((a, b) -> Double.compare(a.mse(), b.mse()))
                .orElse(ses);
    }

    private ForecastComputation ses(
            List<Double> series, Double alphaOverride, int horizonMonths, double floor, double ceiling) {
        double alpha = alphaOverride != null ? alphaOverride : pickBestAlphaSes(series, floor, ceiling);
        List<Double> fitted = new ArrayList<>();
        double level = series.get(0);
        fitted.add(level);

        double sumSq = 0.0;
        double sumAbs = 0.0;
        int n = 0;
        for (int t = 1; t < series.size(); t++) {
            double forecast = level;
            fitted.add(forecast);
            double err = series.get(t) - forecast;
            sumSq += err * err;
            sumAbs += Math.abs(err);
            n++;
            level = alpha * series.get(t) + (1 - alpha) * level;
        }
        if (fitted.size() < series.size()) {
            fitted.add(level);
        }
        List<Double> forecast = capForecast(constantForecast(level, horizonMonths), floor, ceiling);
        return new ForecastComputation(
                "SES", alpha, null, fitted, forecast, mse(sumSq, n), mae(sumAbs, n), countCapped(forecast, floor, ceiling));
    }

    private ForecastComputation holt(
            List<Double> series,
            Double alphaOverride,
            Double betaOverride,
            int horizonMonths,
            double floor,
            double ceiling) {
        double bestAlpha = alphaOverride != null ? alphaOverride : 0.3;
        double bestBeta = betaOverride != null ? betaOverride : 0.2;
        if (alphaOverride == null || betaOverride == null) {
            double bestMse = Double.POSITIVE_INFINITY;
            for (int ai = 10; ai <= 70; ai += 10) {
                for (int bi = 10; bi <= 70; bi += 10) {
                    double a = alphaOverride != null ? alphaOverride : ai / 100.0;
                    double b = betaOverride != null ? betaOverride : bi / 100.0;
                    Metrics m = holtMetrics(series, a, b);
                    if (m.mse() < bestMse) {
                        bestMse = m.mse();
                        bestAlpha = a;
                        bestBeta = b;
                    }
                }
            }
        }

        double level = series.get(0);
        double trend = series.get(1) - series.get(0);
        trend = capTrend(trend, level);
        List<Double> fitted = new ArrayList<>();
        fitted.add(level);

        double sumSq = 0.0;
        double sumAbs = 0.0;
        int n = 0;
        for (int t = 1; t < series.size(); t++) {
            double forecast = level + trend;
            fitted.add(forecast);
            double actual = series.get(t);
            double err = actual - forecast;
            sumSq += err * err;
            sumAbs += Math.abs(err);
            n++;

            double prevLevel = level;
            level = bestAlpha * actual + (1 - bestAlpha) * (level + trend);
            trend = bestBeta * (level - prevLevel) + (1 - bestBeta) * trend;
            trend = capTrend(trend, level);
        }

        List<Double> forecast = new ArrayList<>();
        double phiPow = HOLT_DAMPING;
        double dampedTrendSum = 0.0;
        for (int h = 1; h <= horizonMonths; h++) {
            dampedTrendSum += phiPow * trend;
            forecast.add(clamp(level + dampedTrendSum, floor, ceiling));
            phiPow *= HOLT_DAMPING;
        }
        return new ForecastComputation(
                "HOLT",
                bestAlpha,
                bestBeta,
                fitted,
                forecast,
                mse(sumSq, n),
                mae(sumAbs, n),
                countCapped(forecast, floor, ceiling));
    }

    private static double capTrend(double trend, double level) {
        double maxStep = Math.max(1.0, Math.abs(level) * MAX_TREND_RATIO);
        if (Math.abs(trend) <= maxStep) {
            return trend;
        }
        return Math.copySign(maxStep, trend);
    }

    private ForecastComputation movingAverage(
            List<Double> series, int horizonMonths, double floor, double ceiling) {
        int[] windows = {3, 4, 6};
        int bestWindow = 3;
        double bestMse = Double.POSITIVE_INFINITY;
        Metrics bestMetrics = null;
        List<Double> bestFitted = null;
        for (int w : windows) {
            if (series.size() <= w) {
                continue;
            }
            List<Double> fitted = maFitted(series, w);
            Metrics metrics = metrics(series, fitted);
            if (metrics.mse() < bestMse) {
                bestMse = metrics.mse();
                bestWindow = w;
                bestMetrics = metrics;
                bestFitted = fitted;
            }
        }
        if (bestFitted == null) {
            bestWindow = Math.max(2, Math.min(3, series.size() - 1));
            bestFitted = maFitted(series, bestWindow);
            bestMetrics = metrics(series, bestFitted);
        }
        Metrics resolvedMetrics =
                bestMetrics != null ? bestMetrics : new Metrics(Double.POSITIVE_INFINITY, Double.POSITIVE_INFINITY);

        List<Double> work = new ArrayList<>(series);
        List<Double> rawForecast = new ArrayList<>();
        for (int h = 0; h < horizonMonths; h++) {
            int from = Math.max(0, work.size() - bestWindow);
            double avg = work.subList(from, work.size()).stream().mapToDouble(v -> v).average().orElse(0.0);
            rawForecast.add(avg);
            work.add(avg);
        }
        List<Double> forecast = capForecast(rawForecast, floor, ceiling);
        return new ForecastComputation(
                "MA(" + bestWindow + ")",
                0.0,
                null,
                bestFitted,
                forecast,
                resolvedMetrics.mse(),
                resolvedMetrics.mae(),
                countCapped(forecast, floor, ceiling));
    }

    private List<Double> maFitted(List<Double> series, int window) {
        List<Double> fitted = new ArrayList<>();
        fitted.add(series.get(0));
        for (int t = 1; t < series.size(); t++) {
            int from = Math.max(0, t - window);
            double avg = series.subList(from, t).stream().mapToDouble(v -> v).average().orElse(series.get(0));
            fitted.add(avg);
        }
        return fitted;
    }

    private Metrics holtMetrics(List<Double> series, double alpha, double beta) {
        double level = series.get(0);
        double trend = capTrend(series.get(1) - series.get(0), level);
        double sumSq = 0.0;
        double sumAbs = 0.0;
        int n = 0;
        for (int t = 1; t < series.size(); t++) {
            double forecast = level + trend;
            double actual = series.get(t);
            double err = actual - forecast;
            sumSq += err * err;
            sumAbs += Math.abs(err);
            n++;
            double prevLevel = level;
            level = alpha * actual + (1 - alpha) * (level + trend);
            trend = beta * (level - prevLevel) + (1 - beta) * trend;
            trend = capTrend(trend, level);
        }
        return new Metrics(mse(sumSq, n), mae(sumAbs, n));
    }

    private Metrics metrics(List<Double> actual, List<Double> fitted) {
        double sumSq = 0.0;
        double sumAbs = 0.0;
        int n = 0;
        for (int i = 1; i < actual.size() && i < fitted.size(); i++) {
            double err = actual.get(i) - fitted.get(i);
            sumSq += err * err;
            sumAbs += Math.abs(err);
            n++;
        }
        return new Metrics(mse(sumSq, n), mae(sumAbs, n));
    }

    private List<Double> constantForecast(double value, int horizonMonths) {
        List<Double> out = new ArrayList<>();
        for (int i = 0; i < horizonMonths; i++) {
            out.add(value);
        }
        return out;
    }

    private List<Double> capForecast(List<Double> raw, double floor, double ceiling) {
        List<Double> out = new ArrayList<>(raw.size());
        for (double v : raw) {
            out.add(clamp(v, floor, ceiling));
        }
        return out;
    }

    private static double clamp(double v, double floor, double ceiling) {
        return Math.max(floor, Math.min(ceiling, v));
    }

    private static int countCapped(List<Double> forecast, double floor, double ceiling) {
        int n = 0;
        for (double v : forecast) {
            if (v <= floor + 0.01 || v >= ceiling - 0.01) {
                n++;
            }
        }
        return n;
    }

    private double pickBestAlphaSes(List<Double> series, double floor, double ceiling) {
        double bestAlpha = 0.3;
        double bestMse = Double.POSITIVE_INFINITY;
        for (int i = 5; i <= 70; i += 5) {
            double a = i / 100.0;
            ForecastComputation c = ses(series, a, 1, floor, ceiling);
            if (c.mse() < bestMse) {
                bestMse = c.mse();
                bestAlpha = a;
            }
        }
        return bestAlpha;
    }

    private double mse(double sumSq, int n) {
        return n == 0 ? Double.POSITIVE_INFINITY : (sumSq / n);
    }

    private double mae(double sumAbs, int n) {
        return n == 0 ? Double.POSITIVE_INFINITY : (sumAbs / n);
    }

    private Model parseModel(String model) {
        if (model == null || model.isBlank()) {
            return Model.AUTO;
        }
        try {
            return Model.valueOf(model.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("model must be one of: AUTO, SES, HOLT, MA");
        }
    }

    private enum Model {
        AUTO,
        SES,
        HOLT,
        MA
    }

    private record Preprocessed(
            List<Double> raw,
            List<Double> cleaned,
            List<Boolean> outlierFlags,
            int outlierCount,
            double floor,
            double ceiling) {}

    private record ForecastComputation(
            String model,
            double alpha,
            Double beta,
            List<Double> fitted,
            List<Double> forecast,
            double mse,
            double mae,
            int cappedSteps) {}

    private record Metrics(double mse, double mae) {}
}
