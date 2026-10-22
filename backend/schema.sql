-- =============================================================
--  SISTEMA DE FACTURACIÓN PyME — SQLite
-- =============================================================

-- Limpieza segura (orden inverso por FK)
DROP TABLE IF EXISTS lineas_factura;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;

-- =============================================================
-- 1. CLIENTES
-- =============================================================
CREATE TABLE clientes (
  id        INTEGER  PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT     NOT NULL,
  email     TEXT     NOT NULL UNIQUE,
  telefono  TEXT,
  direccion TEXT,
  rfc       TEXT     UNIQUE,
  activo    INTEGER  NOT NULL DEFAULT 1,   -- 1=true 0=false
  creado_en TEXT     NOT NULL DEFAULT (datetime('now')),

  CHECK(email LIKE '%@%.%')
);

-- =============================================================
-- 2. PRODUCTOS
-- =============================================================
CREATE TABLE productos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  descripcion TEXT,
  precio      REAL    NOT NULL CHECK(precio > 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  unidad      TEXT    NOT NULL DEFAULT 'pieza',  -- pieza, kg, litro, hora...
  activo      INTEGER NOT NULL DEFAULT 1,
  creado_en   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- 3. FACTURAS (cabecera)
-- =============================================================
CREATE TABLE facturas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  folio             TEXT    NOT NULL UNIQUE,           -- Ej. "F-2025-0001"
  cliente_id        INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha_emision     TEXT    NOT NULL DEFAULT (date('now')),
  fecha_vencimiento TEXT    NOT NULL,
  estado            TEXT    NOT NULL DEFAULT 'pendiente'
                            CHECK(estado IN ('pendiente','pagada','cancelada')),
  subtotal          REAL    NOT NULL DEFAULT 0,
  impuesto_pct      REAL    NOT NULL DEFAULT 16.0 CHECK(impuesto_pct >= 0 AND impuesto_pct <= 100),
  total             REAL    NOT NULL DEFAULT 0,
  notas             TEXT,
  creado_en         TEXT    NOT NULL DEFAULT (datetime('now')),

  CHECK(fecha_vencimiento >= fecha_emision)
);

-- =============================================================
-- 4. LINEAS DE FACTURA (detalle)
-- =============================================================
CREATE TABLE lineas_factura (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id      INTEGER NOT NULL REFERENCES facturas(id)  ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad        REAL    NOT NULL CHECK(cantidad > 0),
  precio_unitario REAL    NOT NULL CHECK(precio_unitario > 0),
  descuento_pct   REAL    NOT NULL DEFAULT 0 CHECK(descuento_pct >= 0 AND descuento_pct < 100),
  -- subtotal calculado: cantidad * precio * (1 - descuento%)
  subtotal        REAL    GENERATED ALWAYS AS
                    (ROUND(cantidad * precio_unitario * (1.0 - descuento_pct / 100.0), 2))
                  VIRTUAL
);

-- =============================================================
-- ÍNDICES (rendimiento en consultas frecuentes)
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_facturas_cliente   ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado    ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_lineas_factura_id  ON lineas_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_lineas_producto_id ON lineas_factura(producto_id);

-- =============================================================
-- SEED DATA — Datos de prueba
-- =============================================================

-- Clientes
INSERT OR IGNORE INTO clientes (nombre, email, telefono, direccion, rfc) VALUES
  ('Comercializadora Ramírez S.A.',  'contacto@ramirez.mx',   '55-1234-5678', 'Av. Insurgentes 200, CDMX',          'RAMX850101ABC'),
  ('Ferretería El Tornillo',         'ventas@eltornillo.com', '81-9876-5432', 'Calle Morelos 45, Monterrey',        'FETE920615XYZ'),
  ('Papelería Creativa',             'info@papelcreativa.mx', '33-4455-6677', 'Blvd. Ávila Camacho 10, Guadalajara','PACR780320JKL'),
  ('Consultora Nexus LLC',           'admin@nexus.io',        NULL,           NULL,                                  NULL);

-- Productos
INSERT OR IGNORE INTO productos (nombre, descripcion, precio, stock, unidad) VALUES
  ('Resma papel bond A4',   'Papel bond 75g, 500 hojas',          89.00,  350, 'resma'),
  ('Engrapadora metálica',  'Capacidad 25 hojas, incluye grapas', 149.50, 80,  'pieza'),
  ('Cartucho tinta negra',  'Compatible HP serie 60',             220.00, 120, 'pieza'),
  ('Folder Manila Oficio',  'Paquete 50 folders',                  45.00, 500, 'paquete'),
  ('Pluma punto fino',      'Tinta gel azul, caja 12 piezas',      98.00, 200, 'caja'),
  ('Hora consultoría TI',   'Servicio profesional por hora',      850.00, 999, 'hora');

-- Factura 1 (pendiente)
INSERT OR IGNORE INTO facturas (id, folio, cliente_id, fecha_emision, fecha_vencimiento, estado, notas)
VALUES (1, 'F-2025-0001', 1, '2025-01-10', '2025-02-10', 'pendiente', 'Primera compra del año');

INSERT OR IGNORE INTO lineas_factura (factura_id, producto_id, cantidad, precio_unitario, descuento_pct) VALUES
  (1, 1, 10, 89.00, 5),
  (1, 3,  5, 220.00, 0),
  (1, 4, 20, 45.00, 10);

UPDATE facturas SET
  subtotal = (SELECT ROUND(SUM(cantidad * precio_unitario * (1 - descuento_pct/100.0)), 2) FROM lineas_factura WHERE factura_id = 1),
  total    = (SELECT ROUND(SUM(cantidad * precio_unitario * (1 - descuento_pct/100.0)) * (1 + impuesto_pct/100.0), 2) FROM lineas_factura lf JOIN facturas f2 ON f2.id = lf.factura_id WHERE lf.factura_id = 1)
WHERE id = 1;

-- Factura 2 (pagada)
INSERT OR IGNORE INTO facturas (id, folio, cliente_id, fecha_emision, fecha_vencimiento, estado)
VALUES (2, 'F-2025-0002', 2, '2025-01-15', '2025-01-30', 'pagada');

INSERT OR IGNORE INTO lineas_factura (factura_id, producto_id, cantidad, precio_unitario, descuento_pct) VALUES
  (2, 2, 3, 149.50, 0),
  (2, 5, 6, 98.00,  0);

UPDATE facturas SET
  subtotal = (SELECT ROUND(SUM(cantidad * precio_unitario), 2) FROM lineas_factura WHERE factura_id = 2),
  total    = (SELECT ROUND(SUM(cantidad * precio_unitario) * 1.16, 2) FROM lineas_factura WHERE factura_id = 2)
WHERE id = 2;

-- Factura 3 (consultoría, exenta de IVA)
INSERT OR IGNORE INTO facturas (id, folio, cliente_id, fecha_emision, fecha_vencimiento, estado, impuesto_pct, notas)
VALUES (3, 'F-2025-0003', 4, '2025-02-01', '2025-03-01', 'pendiente', 0, 'Exento de IVA - Exportación');

INSERT OR IGNORE INTO lineas_factura (factura_id, producto_id, cantidad, precio_unitario) VALUES
  (3, 6, 8, 850.00);

UPDATE facturas SET subtotal = 6800, total = 6800 WHERE id = 3;
