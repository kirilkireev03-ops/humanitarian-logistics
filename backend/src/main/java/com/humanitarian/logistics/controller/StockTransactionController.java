package com.humanitarian.logistics.controller;

import com.humanitarian.logistics.dto.StockTransactionCreate;
import com.humanitarian.logistics.dto.StockTransactionDto;
import com.humanitarian.logistics.dto.StockTransactionNotesRequest;
import com.humanitarian.logistics.service.StockTransactionService;
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
@RequestMapping("/api/transactions")
public class StockTransactionController {

    private final StockTransactionService stockTransactionService;

    public StockTransactionController(StockTransactionService stockTransactionService) {
        this.stockTransactionService = stockTransactionService;
    }

    @GetMapping
    public List<StockTransactionDto> list() {
        return stockTransactionService.findAll();
    }

    @GetMapping("/{id}")
    public StockTransactionDto get(@PathVariable Long id) {
        return stockTransactionService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StockTransactionDto create(@Valid @RequestBody StockTransactionCreate request) {
        return stockTransactionService.create(request);
    }

    @PutMapping("/{id}")
    public StockTransactionDto updateNotes(@PathVariable Long id, @RequestBody StockTransactionNotesRequest body) {
        return stockTransactionService.update(id, body != null ? body.notes() : null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        stockTransactionService.delete(id);
    }
}
