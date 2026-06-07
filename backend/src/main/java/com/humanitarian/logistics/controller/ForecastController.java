package com.humanitarian.logistics.controller;

import com.humanitarian.logistics.dto.ForecastResponse;
import com.humanitarian.logistics.service.DemandForecastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast")
@Tag(name = "Forecast", description = "Прогноз попиту за історією OUTBOUND (SES, Холт, ковзне середнє, AUTO за MSE)")
public class ForecastController {

    private final DemandForecastService demandForecastService;

    public ForecastController(DemandForecastService demandForecastService) {
        this.demandForecastService = demandForecastService;
    }

    @GetMapping
    @Operation(
            summary = "Прогноз попиту",
            description =
                    "Місячні суми OUTBOUND. Моделі: SES, HOLT (згасаючий тренд), MA, AUTO — вибір за мінімумом MSE (ПКПМ); у відповіді також MAE (САП). "
                            + "Перед розрахунком — winsorization викидів (1.5×IQR), прогноз обмежується коридором (forecastFloor/forecastCeiling). "
                            + "Недостатньо історії: HTTP 400 з текстом «Insufficient history».")
    public ForecastResponse forecast(
            @Parameter(description = "ID вантажу") @RequestParam Long cargoId,
            @Parameter(description = "AUTO | SES | HOLT | MA") @RequestParam(defaultValue = "AUTO") String model,
            @Parameter(description = "α для SES/HOLT, (0;1], опційно") @RequestParam(required = false) Double alpha,
            @Parameter(description = "β для HOLT, (0;1], опційно") @RequestParam(required = false) Double beta,
            @Parameter(description = "Горизонт прогнозу, міс.") @RequestParam(defaultValue = "6") int horizon,
            @Parameter(description = "Глибина історії, міс. (3…120)") @RequestParam(defaultValue = "24") int historyMonths) {
        return demandForecastService.forecast(cargoId, model, alpha, beta, horizon, historyMonths);
    }
}
