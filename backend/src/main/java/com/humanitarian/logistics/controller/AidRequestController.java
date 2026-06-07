package com.humanitarian.logistics.controller;

import com.humanitarian.logistics.dto.AidRequestCreateUpdate;
import com.humanitarian.logistics.dto.AidRequestDto;
import com.humanitarian.logistics.service.AidRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aid-requests")
public class AidRequestController {

    private final AidRequestService aidRequestService;

    public AidRequestController(AidRequestService aidRequestService) {
        this.aidRequestService = aidRequestService;
    }

    @GetMapping
    public List<AidRequestDto> list() {
        return aidRequestService.findAll();
    }

    @GetMapping("/{id}")
    public AidRequestDto get(@PathVariable Long id) {
        return aidRequestService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AidRequestDto create(@Valid @RequestBody AidRequestCreateUpdate request) {
        return aidRequestService.create(request);
    }

    @PutMapping("/{id}")
    public AidRequestDto update(@PathVariable Long id, @Valid @RequestBody AidRequestCreateUpdate request) {
        return aidRequestService.update(id, request);
    }

    @PostMapping("/{id}/fulfill")
    public AidRequestDto fulfill(@PathVariable Long id) {
        return aidRequestService.fulfill(id);
    }

    @PostMapping("/{id}/approve")
    public AidRequestDto approve(@PathVariable Long id) {
        return aidRequestService.approve(id);
    }

    @PostMapping(value = "/{id}/reject", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AidRequestDto reject(@PathVariable Long id, @RequestBody(required = false) RejectBody body) {
        return aidRequestService.reject(id, body != null ? body.reason() : null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        aidRequestService.delete(id);
    }

    public record RejectBody(String reason) {}
}
