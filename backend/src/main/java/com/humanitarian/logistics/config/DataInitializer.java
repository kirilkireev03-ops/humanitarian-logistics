package com.humanitarian.logistics.config;

import com.humanitarian.logistics.dto.AidRequestCreateUpdate;
import com.humanitarian.logistics.dto.CargoRequest;
import com.humanitarian.logistics.dto.StockTransactionCreate;
import com.humanitarian.logistics.dto.UserRequest;
import com.humanitarian.logistics.dto.WarehouseRequest;
import com.humanitarian.logistics.model.RequestStatus;
import com.humanitarian.logistics.model.TransactionType;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import com.humanitarian.logistics.service.AidRequestService;
import com.humanitarian.logistics.service.AuditLogService;
import com.humanitarian.logistics.service.CargoService;
import com.humanitarian.logistics.service.StockTransactionService;
import com.humanitarian.logistics.service.UserService;
import com.humanitarian.logistics.service.WarehouseService;
import com.humanitarian.logistics.model.UserRole;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final int EXPECTED_WAREHOUSES = 7;
    private static final int EXPECTED_CARGO_TYPES = 14;

    private final WarehouseRepository warehouseRepository;
    private final CargoRepository cargoRepository;
    private final DemoDataCleaner demoDataCleaner;
    private final WarehouseService warehouseService;
    private final CargoService cargoService;
    private final UserService userService;
    private final StockTransactionService stockTransactionService;
    private final AidRequestService aidRequestService;
    private final AuditLogService auditLogService;

    public DataInitializer(
            WarehouseRepository warehouseRepository,
            CargoRepository cargoRepository,
            DemoDataCleaner demoDataCleaner,
            WarehouseService warehouseService,
            CargoService cargoService,
            UserService userService,
            StockTransactionService stockTransactionService,
            AidRequestService aidRequestService,
            AuditLogService auditLogService) {
        this.warehouseRepository = warehouseRepository;
        this.cargoRepository = cargoRepository;
        this.demoDataCleaner = demoDataCleaner;
        this.warehouseService = warehouseService;
        this.cargoService = cargoService;
        this.userService = userService;
        this.stockTransactionService = stockTransactionService;
        this.aidRequestService = aidRequestService;
        this.auditLogService = auditLogService;
    }

    @Override
    public void run(String... args) {
        long warehouses = warehouseRepository.count();
        long cargoTypes = cargoRepository.count();
        if (warehouses > 0 && isDemoComplete(warehouses, cargoTypes)) {
            log.info(
                    "Demo data present (warehouses={}, cargo={}), skipping seed.",
                    warehouses,
                    cargoTypes);
            return;
        }
        if (warehouses > 0) {
            log.warn(
                    "Incomplete demo database detected (warehouses={}, cargo={}, expected {}/{}). Reseeding...",
                    warehouses,
                    cargoTypes,
                    EXPECTED_WAREHOUSES,
                    EXPECTED_CARGO_TYPES);
            demoDataCleaner.clearAll();
        } else {
            log.info("Empty database — loading demo data...");
        }
        loadDemoData();
    }

    private boolean isDemoComplete(long warehouses, long cargoTypes) {
        return warehouses >= EXPECTED_WAREHOUSES && cargoTypes >= EXPECTED_CARGO_TYPES;
    }

    private void loadDemoData() {
        log.info("Loading full demo data...");

        userService.create(new UserRequest("admin", "admin123", "Адміністратор", "admin@example.local", UserRole.ADMIN));
        userService.create(new UserRequest("coordinator", "coord123", "Координатор", "coord@example.local", UserRole.COORDINATOR));

        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        Instant seedAt = now.minusDays(45).toInstant();

        // Warehouses (more locations for richer demo)
        var w1 = warehouseService.create(new WarehouseRequest("Хаб Київ", "вул. Логістична 1", "Київська обл.", 50000));
        var w2 = warehouseService.create(new WarehouseRequest("Склад Харків", "пр. Допомоги 5", "Харківська обл.", 20000));
        var w3 = warehouseService.create(new WarehouseRequest("Пункт Львів", "вул. Гуманітарна 3", "Львівська обл.", 15000));
        var w4 = warehouseService.create(new WarehouseRequest("Хаб Одеса", "наб. Волонтерів 12", "Одеська обл.", 12000));
        var w5 = warehouseService.create(new WarehouseRequest("Склад Дніпро", "вул. Відновлення 8", "Дніпропетровська обл.", 18000));
        var w6 = warehouseService.create(new WarehouseRequest("Пункт Запоріжжя", "вул. Стійкості 14", "Запорізька обл.", 10000));
        var w7 = warehouseService.create(new WarehouseRequest("Склад Вінниця", "вул. Єдності 21", "Вінницька обл.", 9000));

        // Cargo types (expanded assortment)
        var c1 = cargoService.create(new CargoRequest("Консерви", "Харчові консерви", "ящ", "Їжа"));
        var c2 = cargoService.create(new CargoRequest("Вода питна", "Пляшки 1.5 л", "ящ", "Вода"));
        var c3 = cargoService.create(new CargoRequest("Ковдри", "Теплі ковдри", "шт", "Текстиль"));
        var c4 = cargoService.create(new CargoRequest("Аптечки", "Базові медикаменти", "кор", "Медицина"));
        var c5 = cargoService.create(new CargoRequest("Гігієнічні набори", "Мило, засоби догляду, серветки", "набір", "Гігієна"));
        var c6 = cargoService.create(new CargoRequest("Ліки", "Препарати першої необхідності", "кор", "Медицина"));
        var c7 = cargoService.create(new CargoRequest("Одяг", "Теплий одяг та взуття", "шт", "Одяг"));
        var c8 = cargoService.create(new CargoRequest("Дитяче харчування", "Пюре та суміші", "банка", "Діти"));
        var c9 = cargoService.create(new CargoRequest("Генератори", "Портативні генератори 2-5 кВт", "шт", "Енергетика"));
        var c10 = cargoService.create(new CargoRequest("Павербанки", "Резервне живлення 10 000-20 000 mAh", "шт", "Енергетика"));
        var c11 = cargoService.create(new CargoRequest("Корм для тварин", "Сухий корм для домашніх тварин", "мішок", "Тварини"));
        var c12 = cargoService.create(new CargoRequest("Паливні брикети", "Тверде паливо для польових кухонь", "пак", "Енергетика"));
        var c13 = cargoService.create(new CargoRequest("Підгузки дитячі", "Підгузки розмірів 2-5", "упак", "Діти"));
        var c14 = cargoService.create(new CargoRequest("Рації", "Портативні радіостанції для координації", "шт", "Зв'язок"));

        // Initial inbound to ensure stock never goes negative in demo
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c1.id(), 14000, "Стартове надходження (консерви)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c2.id(), 10000, "Стартове надходження (вода)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c3.id(), 6000, "Стартове надходження (ковдри)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c4.id(), 3500, "Стартове надходження (аптечки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c5.id(), 4200, "Стартове надходження (гігієна)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c6.id(), 3800, "Стартове надходження (ліки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c7.id(), 5200, "Стартове надходження (одяг)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c8.id(), 3000, "Стартове надходження (діти)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c9.id(), 260, "Стартове надходження (генератори)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c10.id(), 1800, "Стартове надходження (павербанки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c11.id(), 950, "Стартове надходження (корм)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c12.id(), 2100, "Стартове надходження (паливні брикети)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c13.id(), 2600, "Стартове надходження (підгузки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c14.id(), 180, "Стартове надходження (рації)", null, seedAt));

        // Regionally distributed inbound
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w2.id(), c1.id(), 3200, "Регіональне надходження (консерви)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w2.id(), c2.id(), 2200, "Регіональне надходження (вода)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w2.id(), c5.id(), 1200, "Регіональне надходження (гігієна)", null, seedAt));

        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w3.id(), c3.id(), 1600, "Регіональне надходження (ковдри)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w3.id(), c4.id(), 900, "Регіональне надходження (аптечки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w3.id(), c6.id(), 800, "Регіональне надходження (ліки)", null, seedAt));

        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w4.id(), c2.id(), 1500, "Регіональне надходження (вода)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w4.id(), c5.id(), 700, "Регіональне надходження (гігієна)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w4.id(), c8.id(), 500, "Регіональне надходження (діти)", null, seedAt));

        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w5.id(), c1.id(), 2200, "Регіональне надходження (консерви)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w5.id(), c3.id(), 900, "Регіональне надходження (ковдри)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w5.id(), c7.id(), 1000, "Регіональне надходження (одяг)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w6.id(), c10.id(), 500, "Регіональне надходження (павербанки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w6.id(), c9.id(), 70, "Регіональне надходження (генератори)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w7.id(), c11.id(), 280, "Регіональне надходження (корм)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w7.id(), c5.id(), 600, "Регіональне надходження (гігієна)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w2.id(), c13.id(), 700, "Регіональне надходження (підгузки)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w3.id(), c12.id(), 420, "Регіональне надходження (брикети)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w4.id(), c14.id(), 35, "Регіональне надходження (рації)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w6.id(), c12.id(), 260, "Регіональне надходження (брикети)", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.INBOUND, null, w7.id(), c13.id(), 390, "Регіональне надходження (підгузки)", null, seedAt));

        // Transfers between warehouses
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w2.id(), c4.id(), 550, "Переміщення аптечок на схід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w2.id(), c3.id(), 380, "Переміщення ковдр на схід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w3.id(), c2.id(), 900, "Переміщення води на захід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w4.id(), c1.id(), 650, "Переміщення консервів на південь", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w5.id(), c5.id(), 720, "Переміщення гігієни в центр", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w6.id(), c10.id(), 240, "Переміщення павербанків на схід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w7.id(), c11.id(), 110, "Переміщення корму у центр-захід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w3.id(), c12.id(), 210, "Переміщення брикетів на захід", null, seedAt));
        stockTransactionService.create(new StockTransactionCreate(TransactionType.TRANSFER, w1.id(), w2.id(), c14.id(), 25, "Переміщення рацій на схід", null, seedAt));

        // Historical OUTBOUND (for forecasting module)
        int historyMonths = 36;
        for (int m = 0; m < historyMonths; m++) {
            ZonedDateTime at = now.minusMonths(historyMonths - 1 - m).withDayOfMonth(15).withHour(12).withMinute(0).withSecond(0).withNano(0);
            Instant ts = at.toInstant();

            int q1 = 110 + (m % 6) * 6 - (m % 4) * 2;
            int q2 = 85 + (m % 5) * 7 - (m % 3) * 3;
            int q3 = 45 + (m % 7) * 5 - (m % 4) * 2;
            int q4 = 25 + (m % 6) * 4 - (m % 3) * 2;
            int q5 = 30 + (m % 5) * 4 - (m % 4) * 1;
            int q6 = 22 + (m % 6) * 3 - (m % 3) * 1;
            int q7 = 20 + (m % 5) * 6 - (m % 4) * 2;
            int q8 = 15 + (m % 6) * 3 - (m % 3) * 2;
            int q12 = 18 + (m % 6) * 4 - (m % 4) * 1;
            int q13 = 22 + (m % 7) * 3 - (m % 5) * 1;
            int q9 = 8 + (m % 6) * 2 - (m % 4) * 1;

            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c1.id(), Math.max(10, q1),
                            "Історичний відпуск (консерви)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c2.id(), Math.max(8, q2),
                            "Історичний відпуск (вода)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c3.id(), Math.max(5, q3),
                            "Історичний відпуск (ковдри)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c4.id(), Math.max(3, q4),
                            "Історичний відпуск (аптечки)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c5.id(), Math.max(3, q5),
                            "Історичний відпуск (гігієна)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c6.id(), Math.max(3, q6),
                            "Історичний відпуск (ліки)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c7.id(), Math.max(3, q7),
                            "Історичний відпуск (одяг)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c8.id(), Math.max(2, q8),
                            "Історичний відпуск (діти)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c12.id(), Math.max(3, q12),
                            "Історичний відпуск (паливні брикети)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c13.id(), Math.max(4, q13),
                            "Історичний відпуск (підгузки)", null, ts));
            stockTransactionService.create(
                    new StockTransactionCreate(
                            TransactionType.OUTBOUND, w1.id(), null, c9.id(), Math.max(4, q9),
                            "Історичний відпуск (генератори)", null, ts));
        }

        // Аномальні піки для демонстрації winsorization на графіку прогнозу (ковдри)
        stockTransactionService.create(
                new StockTransactionCreate(
                        TransactionType.OUTBOUND,
                        w1.id(),
                        null,
                        c3.id(),
                        420,
                        "Демо: аномальний пік відпуску (ковдри)",
                        null,
                        now.minusMonths(9).withDayOfMonth(18).withHour(12).withMinute(0).withSecond(0).withNano(0).toInstant()));
        stockTransactionService.create(
                new StockTransactionCreate(
                        TransactionType.OUTBOUND,
                        w1.id(),
                        null,
                        c3.id(),
                        380,
                        "Демо: аномальний пік відпуску (ковдри)",
                        null,
                        now.minusMonths(21).withDayOfMonth(12).withHour(12).withMinute(0).withSecond(0).withNano(0).toInstant()));

        // Recent INBOUND only (dashboard operational chart) — без додаткового OUTBOUND,
        // щоб не дублювати місячний відпуск і не спотворювати прогноз попиту.
        int recentDays = 18;
        for (int d = 0; d < recentDays; d++) {
            Instant at = now.minusDays(d).toInstant();

            if (d % 2 == 0) {
                stockTransactionService.create(
                        new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c5.id(), 80 + d * 3, "Recent inbound (гігієна)", null, at));
                stockTransactionService.create(
                        new StockTransactionCreate(TransactionType.INBOUND, null, w1.id(), c7.id(), 60 + d * 2, "Recent inbound (одяг)", null, at));
            }
        }

        // Aid requests (more scenarios for UI)
        aidRequestService.create(new AidRequestCreateUpdate(w2.id(), c2.id(), 500, RequestStatus.PENDING, "Потреба у воді"));
        aidRequestService.create(new AidRequestCreateUpdate(w3.id(), c3.id(), 120, RequestStatus.APPROVED, "Ковдри для пункту видачі"));
        aidRequestService.create(new AidRequestCreateUpdate(w4.id(), c5.id(), 200, RequestStatus.PENDING, "Гігієнічні набори для сімей"));
        aidRequestService.create(new AidRequestCreateUpdate(w5.id(), c4.id(), 80, RequestStatus.REJECTED, "Недостатній обсяг/логістичні обмеження"));
        aidRequestService.create(new AidRequestCreateUpdate(w2.id(), c7.id(), 150, RequestStatus.APPROVED, "Теплий одяг для ВПО"));
        aidRequestService.create(new AidRequestCreateUpdate(w1.id(), c1.id(), 60, RequestStatus.PENDING, "Консерви для гуманітарних наборів"));
        aidRequestService.create(new AidRequestCreateUpdate(w6.id(), c10.id(), 90, RequestStatus.PENDING, "Павербанки для пунктів незламності"));
        aidRequestService.create(new AidRequestCreateUpdate(w7.id(), c11.id(), 40, RequestStatus.APPROVED, "Корм для евакуйованих тварин"));
        aidRequestService.create(new AidRequestCreateUpdate(w3.id(), c12.id(), 95, RequestStatus.PENDING, "Паливні брикети для польових кухонь"));
        aidRequestService.create(new AidRequestCreateUpdate(w2.id(), c13.id(), 160, RequestStatus.APPROVED, "Підгузки для дитячих центрів"));
        aidRequestService.create(new AidRequestCreateUpdate(w4.id(), c14.id(), 12, RequestStatus.PENDING, "Рації для мобільних бригад"));
        aidRequestService.create(new AidRequestCreateUpdate(w5.id(), c6.id(), 65, RequestStatus.FULFILLED, "Медичні набори для виїзних команд"));
        aidRequestService.create(new AidRequestCreateUpdate(w6.id(), c5.id(), 130, RequestStatus.REJECTED, "Коригування заявки через зміну пріоритетів"));

        auditLogService.logSystem(
                "DEMO_DATA_LOADED",
                "Application",
                null,
                "Повне демо-наповнення: "
                        + EXPECTED_WAREHOUSES
                        + " складів, "
                        + EXPECTED_CARGO_TYPES
                        + " типів вантажів, історія OUTBOUND 36 міс., заявки та журнал транзакцій.");

        log.info(
                "Demo data loaded: {} warehouses, {} cargo types.",
                warehouseRepository.count(),
                cargoRepository.count());
    }
}
