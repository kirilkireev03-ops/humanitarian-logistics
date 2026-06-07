package com.humanitarian.logistics.dto;

import java.util.List;

public record ForecastResponse(
        Long cargoId,
        String cargoName,
        String model,
        double alpha,
        Double beta,
        double mse,
        double mae,
        List<ModelComparisonDto> modelComparisons,
        List<String> historicalPeriodLabels,
        List<Double> historicalDemand,
        List<Double> historicalDemandAdjusted,
        List<Boolean> outlierFlags,
        List<Double> smoothedSeries,
        List<String> forecastPeriodLabels,
        List<Double> forecastValues,
        double forecastFloor,
        double forecastCeiling,
        List<String> warnings,
        String stabilityNote
) {}
