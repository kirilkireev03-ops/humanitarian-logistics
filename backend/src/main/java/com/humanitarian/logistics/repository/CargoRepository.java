package com.humanitarian.logistics.repository;

import com.humanitarian.logistics.model.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CargoRepository extends JpaRepository<Cargo, Long> {
}
