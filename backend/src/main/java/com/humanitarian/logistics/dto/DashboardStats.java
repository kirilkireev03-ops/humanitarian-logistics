package com.humanitarian.logistics.dto;

public record DashboardStats(
        long warehouses,
        long cargoTypes,
        long pendingRequests,
        long transactionsLast30Days,
        long totalStockUnits
) {}
