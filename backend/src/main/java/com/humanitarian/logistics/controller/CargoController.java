package com.humanitarian.logistics.controller;

import com.humanitarian.logistics.dto.CargoRequest;
import com.humanitarian.logistics.dto.CargoResponse;
import com.humanitarian.logistics.service.CargoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cargo")
public class CargoController {

    private final CargoService cargoService;

    public CargoController(CargoService cargoService) {
        this.cargoService = cargoService;
    }

    @GetMapping
    public List<CargoResponse> list() {
        return cargoService.findAll();
    }

    @GetMapping("/{id}")
    public CargoResponse get(@PathVariable Long id) {
        return cargoService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CargoResponse create(@Valid @RequestBody CargoRequest request) {
        return cargoService.create(request);
    }

    @PutMapping("/{id}")
    public CargoResponse update(@PathVariable Long id, @Valid @RequestBody CargoRequest request) {
        return cargoService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        cargoService.delete(id);
    }
}
