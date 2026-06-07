package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.WarehouseRequest;
import com.humanitarian.logistics.dto.WarehouseResponse;
import com.humanitarian.logistics.model.Warehouse;
import com.humanitarian.logistics.repository.WarehouseRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional(readOnly = true)
    public List<WarehouseResponse> findAll() {
        return warehouseRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponse findById(Long id) {
        return warehouseRepository.findById(id).map(this::toResponse).orElseThrow();
    }

    @Transactional
    public WarehouseResponse create(WarehouseRequest request) {
        Warehouse w = new Warehouse();
        apply(w, request);
        return toResponse(warehouseRepository.save(w));
    }

    @Transactional
    public WarehouseResponse update(Long id, WarehouseRequest request) {
        Warehouse w = warehouseRepository.findById(id).orElseThrow();
        apply(w, request);
        return toResponse(warehouseRepository.save(w));
    }

    @Transactional
    public void delete(Long id) {
        warehouseRepository.deleteById(id);
    }

    private void apply(Warehouse w, WarehouseRequest request) {
        w.setName(request.name());
        w.setAddress(request.address());
        w.setRegion(request.region());
        w.setCapacityUnits(request.capacityUnits());
    }

    private WarehouseResponse toResponse(Warehouse w) {
        return new WarehouseResponse(w.getId(), w.getName(), w.getAddress(), w.getRegion(), w.getCapacityUnits());
    }
}
