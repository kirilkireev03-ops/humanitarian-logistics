package com.humanitarian.logistics.controller;

import com.humanitarian.logistics.dto.WarehouseStockDto;
import com.humanitarian.logistics.service.WarehouseStockQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stock")
public class WarehouseStockController {

    private final WarehouseStockQueryService warehouseStockQueryService;

    public WarehouseStockController(WarehouseStockQueryService warehouseStockQueryService) {
        this.warehouseStockQueryService = warehouseStockQueryService;
    }

    @GetMapping
    public List<WarehouseStockDto> all() {
        return warehouseStockQueryService.findAll();
    }

    @GetMapping("/warehouse/{warehouseId}")
    public List<WarehouseStockDto> byWarehouse(@PathVariable Long warehouseId) {
        return warehouseStockQueryService.findByWarehouse(warehouseId);
    }
}
