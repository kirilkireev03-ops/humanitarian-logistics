package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.CargoRequest;
import com.humanitarian.logistics.dto.CargoResponse;
import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.repository.CargoRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CargoService {

    private final CargoRepository cargoRepository;

    public CargoService(CargoRepository cargoRepository) {
        this.cargoRepository = cargoRepository;
    }

    @Transactional(readOnly = true)
    public List<CargoResponse> findAll() {
        return cargoRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CargoResponse findById(Long id) {
        return cargoRepository.findById(id).map(this::toResponse).orElseThrow();
    }

    @Transactional
    public CargoResponse create(CargoRequest request) {
        Cargo c = new Cargo();
        apply(c, request);
        return toResponse(cargoRepository.save(c));
    }

    @Transactional
    public CargoResponse update(Long id, CargoRequest request) {
        Cargo c = cargoRepository.findById(id).orElseThrow();
        apply(c, request);
        return toResponse(cargoRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        cargoRepository.deleteById(id);
    }

    private void apply(Cargo c, CargoRequest request) {
        c.setName(request.name());
        c.setDescription(request.description());
        c.setUnit(request.unit());
        c.setCategory(request.category());
    }

    private CargoResponse toResponse(Cargo c) {
        return new CargoResponse(c.getId(), c.getName(), c.getDescription(), c.getUnit(), c.getCategory());
    }
}
